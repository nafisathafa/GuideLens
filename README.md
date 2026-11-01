# GuideLens 👓⚡
### Real-Time Monitoring Dashboard for AI-Powered Wearable Vision Assistance

GuideLens is a resilient telemetry and monitoring web dashboard designed for guardians and caregivers of visually impaired individuals using an edge AI vision assistance system.

---

## 🏛️ System Architecture & Principles

1. **Push Telemetry Model**: The Raspberry Pi 4 wearable performs all ultrasonic depth sensing and on-device computer vision classification. The web application **only receives** and displays data. The web app never initiates connections to the Pi or contacts hardware.
2. **True State Integrity**: The backend and frontend **never generate fake, random, or mock data**. When the wearable is off or silent, empty states and "Pi Offline" indicators are explicitly rendered.
3. **Fail-Safe Client**: The Raspberry Pi helper library (`pi/guidelens_client.py`) has strict short timeouts (3.0s), never blocks, swallows exceptions, and rate-limits requests so that local audio cues and tactile warnings operate without interruption even during internet outages.
4. **Single-Port Deployment**: FastAPI serves both the REST API, WebSocket streams (`/ws`), and the compiled React SPA static bundle on a unified port.

```
+--------------------------+         HTTPS POST (X-API-Key)         +----------------------------------+
|     Raspberry Pi 4       | -------------------------------------> |         FastAPI Backend          |
| - Ultrasonic HC-SR04     |                                        | - Token digest authentication    |
| - Camera POV Inferences  |                                        | - 15-second offline watchdog     |
| - GPS & Tactile SOS      |                                        | - In-memory buffer + Deduplication|
+--------------------------+                                        +----------------------------------+
                                                                                 |               ^
                                                                          SQLite / Postgres  WebSocket / REST
                                                                                 v               |
                                                                    +----------------------------------+
                                                                    |     React + Tailwind UI          |
                                                                    | - Live depth visualizer & charts |
                                                                    | - POV MJPEG camera stream        |
                                                                    | - Emergency SOS dispatch monitor |
                                                                    +----------------------------------+
```

---

## 🔐 Environment Variables & Secrets

Configure these environment variables in **Replit Secrets** or your `.env` file:

| Variable | Required | Description | Example Value |
| :--- | :---: | :--- | :--- |
| `DEVICE_API_KEY` | **Yes** | Shared authentication token validated via `secrets.compare_digest` on every Pi ingestion request. | `sec_pi_live_948f93a1` |
| `DATABASE_URL` | Optional | Connection string for PostgreSQL (Replit Built-in Database). If empty or unset, automatically defaults to SQLite. | `postgresql://user:pass@ep-host.replit.com/dbname` |
| `GUARDIAN_NAME` | Optional | Primary guardian/caregiver name displayed on the dashboard and SOS screen. | `Sarah Jenkins (Primary Caregiver)` |
| `GUARDIAN_CONTACT` | Optional | Phone number or Telegram handle displayed for emergency contact. | `+1 (555) 019-2834 / @sarah_guardian` |
| `PORT` | Optional | Port for the FastAPI server to listen on. | `8000` |

---

## 🚀 Replit Setup & Deployment Guide

GuideLens runs as a **single deployment**: the backend serves API routes, WebSockets, and the pre-built React frontend static assets.

### 1. Configure Replit Secrets
In your Replit project workspace, open the **Secrets** tool (lock icon) and add:
- `DEVICE_API_KEY`: e.g. `your-secure-device-token`
- `DATABASE_URL`: Your PostgreSQL URL (or leave blank to use local SQLite)
- `GUARDIAN_NAME`: `Your Name`
- `GUARDIAN_CONTACT`: `Your Phone or Telegram handle`

### 2. Build the React Frontend
In the Replit Shell:
```bash
cd frontend
npm install
npm run build
cd ..
```
*(This builds the optimized production assets to `frontend/dist`)*

### 3. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Run the Application
In Replit, set the **Run command** in `.replit` to:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```
Or start manually:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Open your browser to `http://localhost:8000` (or your public Replit URL).

---

## 🍓 Raspberry Pi Setup (`pi/guidelens_client.py`)

1. Copy `pi/guidelens_client.py` onto your Raspberry Pi:
   ```bash
   scp pi/guidelens_client.py pi@raspberrypi.local:/home/pi/guidelens/
   ```
2. Set environment variables on the Raspberry Pi:
   ```bash
   export BASE_URL="https://your-replit-app.replit.app"
   export DEVICE_API_KEY="your-secure-device-token"
   ```
3. Integrating with your existing Pi Python scripts:

### Ultrasonic Sensor Script Integration:
```python
from guidelens_client import send_distance

# In your distance measurement loop:
distance_cm = read_ultrasonic_sensor()
status = "danger" if distance_cm < 20 else "warning" if distance_cm < 50 else "caution" if distance_cm <= 100 else "clear"

# Non-blocking, rate-limited to <= 4 sends/sec, never raises exceptions:
send_distance(distance_cm, status)
```

### Camera & Edge AI Script Integration:
```python
from guidelens_client import send_detection, send_frame

# In your camera inference loop:
send_detection(label="person", confidence=0.92, important=True)
send_frame(encoded_jpeg_bytes)
```

### Emergency SOS Button Script Integration:
```python
from guidelens_client import send_sos

# When physical tactile button is triggered:
send_sos(
    gps_status="ok", 
    lat=37.7749, 
    lon=-122.4194, 
    telegram_sent=True, 
    telegram_error=None
)
```

### Background Heartbeat:
```python
from guidelens_client import start_heartbeat

# Call once at device boot:
start_heartbeat(interval=5)
```

---

## 🧪 Testing with `curl` Commands

You can simulate all Raspberry Pi ingestion messages and verify backend security and offline logic using the following `curl` commands. Replace `http://localhost:8000` with your target host and `dev-pi-secret-key` with your `DEVICE_API_KEY`.

### 1. Initial State (Shows Pi Offline & No Mock Data)
```bash
curl -s http://localhost:8000/api/state
```
**Expected Response:**
```json
{
  "pi_online": false,
  "last_seen": null,
  "seconds_since_last_seen": null,
  "distance_cm": null,
  "obstacle_status": "unavailable",
  "latest_detection": null,
  "latest_detections": [],
  "camera_available": false
}
```

---

### 2. Proof of Authentication: Wrong API Key Returns 401
```bash
curl -i -X POST http://localhost:8000/api/ingest/heartbeat \
  -H "X-API-Key: invalid-token-xyz"
```
**Expected Response:**
```http
HTTP/1.1 401 Unauthorized
{"detail": "Invalid or missing X-API-Key"}
```

---

### 3. Send Heartbeat with Valid Key (Pi Flips to Online)
```bash
curl -s -X POST http://localhost:8000/api/ingest/heartbeat \
  -H "X-API-Key: dev-pi-secret-key"
```
**Expected Response:**
```json
{"status": "ok", "message": "heartbeat acknowledged", "pi_online": true}
```

Verify state now reports `pi_online: true`:
```bash
curl -s http://localhost:8000/api/state
```

---

### 4. Ingest Obstacle Distance (Status Change Triggers DB Save)
```bash
curl -s -X POST http://localhost:8000/api/ingest/distance \
  -H "X-API-Key: dev-pi-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"distance_cm": 35.0, "status": "warning"}'
```
**Expected Response:**
```json
{
  "status": "ok",
  "stored": true,
  "event": {
    "id": 1,
    "type": "obstacle",
    "distance_cm": 35.0,
    "status": "warning",
    "created_at": "..."
  }
}
```

Sending the same status again updates live memory but **skips database insertion** (`stored: false`):
```bash
curl -s -X POST http://localhost:8000/api/ingest/distance \
  -H "X-API-Key: dev-pi-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"distance_cm": 32.0, "status": "warning"}'
```
**Expected Response:**
```json
{"status": "ok", "stored": false, "event": null}
```

---

### 5. Ingest AI Detection (with 10-Second Cooldown Verification)
```bash
curl -s -X POST http://localhost:8000/api/ingest/detection \
  -H "X-API-Key: dev-pi-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "stairs", "confidence": 0.94, "important": true}'
```
**Expected Response:**
```json
{
  "status": "ok",
  "stored": true,
  "event": {
    "id": 1,
    "type": "detection",
    "label": "stairs",
    "confidence": 0.94,
    "important": true,
    "created_at": "..."
  }
}
```

Repeating the same label within 10 seconds is recognized in live memory but **ignored for DB storage**:
```bash
curl -s -X POST http://localhost:8000/api/ingest/detection \
  -H "X-API-Key: dev-pi-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "stairs", "confidence": 0.95, "important": true}'
```
**Expected Response:**
```json
{"status": "ok", "stored": false, "event": null}
```

---

### 6. Ingest Emergency SOS Event
```bash
curl -s -X POST http://localhost:8000/api/ingest/sos \
  -H "X-API-Key: dev-pi-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "gps_status": "ok",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "telegram_sent": true,
    "telegram_error": null
  }'
```
**Expected Response:**
```json
{
  "status": "ok",
  "stored": true,
  "event": {
    "id": 1,
    "type": "sos",
    "gps_status": "ok",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "maps_url": "https://www.google.com/maps?q=37.7749,-122.4194",
    "telegram_sent": true,
    "telegram_error": null,
    "created_at": "..."
  }
}
```

---

### 7. View Merged Activity Timeline
```bash
curl -s http://localhost:8000/api/activity | python3 -m json.tool
```

---

### 8. Proof of Watchdog: 15-Second Silence Flips `pi_online` to `false`
Wait 16 seconds without sending any messages, then run:
```bash
sleep 16 && curl -s http://localhost:8000/api/state
```
**Expected Response:**
```json
{
  "pi_online": false,
  "last_seen": "...",
  "seconds_since_last_seen": 16.1,
  "distance_cm": null,
  "obstacle_status": "unavailable",
  "latest_detection": null,
  "latest_detections": [],
  "camera_available": false
}
```
*(Notice that `pi_online` immediately flips to `false`, and live values are reported as `null` / `"unavailable"`, never stale).*

---

### 9. Camera Stream Unavailable Fallback Check
When no camera frame has arrived in the last 10 seconds:
```bash
curl -i http://localhost:8000/api/camera/stream
```
**Expected Response:**
```http
HTTP/1.1 503 Service Unavailable
Camera unavailable
```
*(The frontend catches this and displays the clean "Camera unavailable" UI state without placeholder frames).*

---

## 📁 Repository Directory Structure

```
guidelens/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Loads DEVICE_API_KEY, DATABASE_URL, GUARDIAN info
│   │   ├── database.py            # SQLAlchemy engine, session maker, SQLite fallback
│   │   ├── models.py              # ObstacleEvent, Detection, SOSEvent tables
│   │   ├── schemas.py             # Pydantic request/response models
│   │   ├── state.py               # In-memory buffer, deduplication & 15s watchdog
│   │   ├── websocket_manager.py   # WebSocket broadcasting to connected browsers
│   │   └── main.py                # FastAPI routes, SPA static file mounting, WS loop
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── vite.config.js             # Vite config with /api and /ws dev proxy
│   ├── tailwind.config.js         # Custom theme, dark mode, danger animations
│   ├── package.json
│   ├── dist/                      # Production compiled SPA bundle
│   └── src/
│       ├── App.jsx                # Root app, WebSocket subscriber & auto-reconnect
│       ├── index.css              # Custom styles & pulse keyframes
│       ├── main.jsx
│       ├── components/
│       │   ├── Sidebar.jsx        # Responsive navigation & Pi status pill
│       │   ├── OfflineBanner.jsx  # Persistent banner when Pi is offline
│       │   └── ToastAlert.jsx     # Floating high-priority cue alerts
│       ├── pages/
│       │   ├── DashboardHome.jsx     # Overview, large status badge, 3 cards, summary
│       │   ├── ObstacleDetection.jsx # Depth gauge, danger banner, Recharts live line
│       │   ├── ObjectDetection.jsx   # POV stream box, confidence bars, history
│       │   ├── EmergencySOS.jsx      # SOS trigger badge, guardian area, GPS maps
│       │   └── ActivityHistory.jsx   # Filterable merged audit timeline
│       └── utils/
│           └── formatters.js      # Status colors, local time formatting
├── pi/
│   └── guidelens_client.py        # Fail-safe, non-blocking helper for Raspberry Pi 4
└── README.md
```
