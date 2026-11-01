import os
import secrets
import asyncio
import logging
from typing import Optional, List
from contextlib import asynccontextmanager

logger = logging.getLogger("guidelens.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

from fastapi import FastAPI, Depends, Header, HTTPException, status, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, Response, StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc

from .config import DEVICE_API_KEY, GUARDIAN_NAME, GUARDIAN_CONTACT
from .database import engine, Base, get_db
from .models import ObstacleEvent, Detection, SOSEvent
from .schemas import DistanceIngest, DetectionIngest, SOSIngest, ConfigResponse, StateResponse
from .state import live_state
from .websocket_manager import ws_manager

# Create database tables
Base.metadata.create_all(bind=engine)

# Background task to watch Pi online/offline transition
async def monitor_pi_status():
    while True:
        try:
            await asyncio.sleep(1.0)
            current_online = live_state.is_pi_online()
            if current_online != live_state.prev_online_state:
                live_state.prev_online_state = current_online
                await ws_manager.broadcast({
                    "type": "state",
                    "data": live_state.get_state()
                })
        except asyncio.CancelledError:
            break
        except Exception as e:
            await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    monitor_task = asyncio.create_task(monitor_pi_status())
    yield
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="GuideLens Monitoring Dashboard",
    description="Backend API and WebSocket server for GuideLens wearable vision assistance system.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication dependency for Raspberry Pi endpoints
def verify_device_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not x_api_key or not secrets.compare_digest(x_api_key, DEVICE_API_KEY):
        logger.warning(f"❌ [AUTH FAILED] Ingest rejected: invalid X-API-Key (received: '{x_api_key}', expected matching '{DEVICE_API_KEY[:4]}***')")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key"
        )
    return True

# ==========================================
# Raspberry Pi Ingest Endpoints
# ==========================================

@app.post("/api/ingest/heartbeat", dependencies=[Depends(verify_device_api_key)])
async def ingest_heartbeat():
    live_state.touch()
    state_data = live_state.get_state()
    logger.info("💓 [HEARTBEAT] Received heartbeat ping. Pi is ONLINE.")
    await ws_manager.broadcast({"type": "state", "data": state_data})
    return {"status": "ok", "message": "heartbeat acknowledged", "pi_online": True}

@app.post("/api/ingest/distance", dependencies=[Depends(verify_device_api_key)])
async def ingest_distance(payload: DistanceIngest, db: Session = Depends(get_db)):
    should_store = live_state.update_distance(payload.distance_cm, payload.status)
    stored_event = None

    if should_store:
        event = ObstacleEvent(
            distance_cm=payload.distance_cm,
            status=payload.status
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        stored_event = event.to_dict()
        await ws_manager.broadcast({"type": "obstacle_event", "data": stored_event})

    logger.info(f"📏 [DISTANCE] {payload.distance_cm} cm | Status: {payload.status} | DB Saved: {should_store}")
    # Always broadcast updated live state
    await ws_manager.broadcast({"type": "state", "data": live_state.get_state()})

    return {
        "status": "ok",
        "stored": should_store,
        "event": stored_event
    }

@app.post("/api/ingest/detection", dependencies=[Depends(verify_device_api_key)])
async def ingest_detection(payload: DetectionIngest, db: Session = Depends(get_db)):
    should_store, live_det = live_state.record_detection(payload.label, payload.confidence, payload.important)
    stored_event = None

    if should_store:
        det = Detection(
            label=payload.label,
            confidence=payload.confidence,
            important=payload.important
        )
        db.add(det)
        db.commit()
        db.refresh(det)
        stored_event = det.to_dict()
        await ws_manager.broadcast({"type": "detection", "data": stored_event})

    # Always broadcast updated live state
    await ws_manager.broadcast({"type": "state", "data": live_state.get_state()})

    return {
        "status": "ok",
        "stored": should_store,
        "event": stored_event
    }

@app.post("/api/ingest/sos", dependencies=[Depends(verify_device_api_key)])
async def ingest_sos(payload: SOSIngest, db: Session = Depends(get_db)):
    live_state.touch()
    
    maps_url = None
    if payload.latitude is not None and payload.longitude is not None:
        maps_url = f"https://www.google.com/maps?q={payload.latitude},{payload.longitude}"

    sos = SOSEvent(
        gps_status=payload.gps_status,
        latitude=payload.latitude,
        longitude=payload.longitude,
        maps_url=maps_url,
        telegram_sent=payload.telegram_sent,
        telegram_error=payload.telegram_error
    )
    db.add(sos)
    db.commit()
    db.refresh(sos)

    sos_dict = sos.to_dict()
    await ws_manager.broadcast({"type": "sos_event", "data": sos_dict})
    await ws_manager.broadcast({"type": "state", "data": live_state.get_state()})

    return {
        "status": "ok",
        "stored": True,
        "event": sos_dict
    }

@app.post("/api/ingest/frame", dependencies=[Depends(verify_device_api_key)])
async def ingest_frame(request: Request):
    content_type = request.headers.get("content-type", "")
    if "image/jpeg" not in content_type and "application/octet-stream" not in content_type:
        raise HTTPException(status_code=400, detail="Content-Type must be image/jpeg")
    
    body = await request.body()
    # Limit to ~150KB to protect against misuse
    if len(body) > 150000:
        raise HTTPException(status_code=413, detail="Frame size too large (max 150 KB)")
    
    prev_avail = live_state.is_camera_available()
    live_state.update_frame(body)
    new_avail = live_state.is_camera_available()

    if prev_avail != new_avail:
        await ws_manager.broadcast({"type": "state", "data": live_state.get_state()})

    return {"status": "ok", "bytes_received": len(body)}

# ==========================================
# Frontend Read-Only Endpoints
# ==========================================

@app.get("/api/config", response_model=ConfigResponse)
async def get_config():
    return {
        "guardian_name": GUARDIAN_NAME,
        "guardian_contact": GUARDIAN_CONTACT
    }

@app.get("/api/state", response_model=StateResponse)
async def get_state():
    return live_state.get_state()

@app.get("/api/obstacles")
async def get_obstacles(limit: int = 50, db: Session = Depends(get_db)):
    limit = min(max(1, limit), 200)
    events = db.query(ObstacleEvent).order_by(desc(ObstacleEvent.id)).limit(limit).all()
    return [e.to_dict() for e in events]

@app.get("/api/detections")
async def get_detections(limit: int = 50, db: Session = Depends(get_db)):
    limit = min(max(1, limit), 200)
    detections = db.query(Detection).order_by(desc(Detection.id)).limit(limit).all()
    return [d.to_dict() for d in detections]

@app.get("/api/sos")
async def get_sos(limit: int = 50, db: Session = Depends(get_db)):
    limit = min(max(1, limit), 200)
    events = db.query(SOSEvent).order_by(desc(SOSEvent.id)).limit(limit).all()
    return [e.to_dict() for e in events]

@app.get("/api/activity")
async def get_activity(limit: int = 100, db: Session = Depends(get_db)):
    limit = min(max(1, limit), 200)
    obstacles = db.query(ObstacleEvent).order_by(desc(ObstacleEvent.id)).limit(limit).all()
    detections = db.query(Detection).order_by(desc(Detection.id)).limit(limit).all()
    sos_events = db.query(SOSEvent).order_by(desc(SOSEvent.id)).limit(limit).all()

    combined = [o.to_dict() for o in obstacles] + [d.to_dict() for d in detections] + [s.to_dict() for s in sos_events]
    # Sort descending by created_at ISO string
    combined.sort(key=lambda item: item.get("created_at") or "", reverse=True)
    return combined[:limit]

@app.get("/api/camera/stream")
async def get_camera_stream():
    if not live_state.is_camera_available():
        return Response(content="Camera unavailable", status_code=503, media_type="text/plain")

    async def stream_frames():
        while live_state.is_camera_available():
            frame = live_state.latest_frame_bytes
            if frame:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                )
            await asyncio.sleep(0.33)  # ~3 fps

    return StreamingResponse(
        stream_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# ==========================================
# WebSocket Endpoint
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    # Send current state on connect
    try:
        await websocket.send_json({
            "type": "state",
            "data": live_state.get_state()
        })
        while True:
            # Keep socket open and consume any incoming ping/messages from client
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

# ==========================================
# Frontend Static Files Serving (Single Deployment)
# ==========================================

frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(frontend_dist_path):
    # Mount assets folder
    assets_path = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Serve index.html for all SPA non-API routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist_path, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend build not found"})
