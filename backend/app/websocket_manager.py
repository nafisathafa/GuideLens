import json
import logging
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger("guidelens.ws")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead_sockets = set()
        for websocket in list(self.active_connections):
            try:
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending message to websocket: {e}")
                dead_sockets.add(websocket)
        for dead in dead_sockets:
            self.disconnect(dead)

ws_manager = WebSocketManager()
