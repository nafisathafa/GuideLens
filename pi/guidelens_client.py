"""
GuideLens Raspberry Pi Client Helper Library
=============================================
This module is designed to be copied directly onto the Raspberry Pi 4.
It handles asynchronous and fail-safe HTTPS data transmission to the GuideLens dashboard.

CRITICAL SAFETY DESIGN:
- All functions catch ALL exceptions and return True on success, False on failure.
- Calls NEVER raise exceptions or block mission-critical execution.
- If network connection drops, the Pi's local assistance features (voice warnings,
  haptic feedback, obstacle buzzer, SOS trigger) continue functioning unaffected.

Usage in Existing Pi Scripts:
-----------------------------
1. Ultrasonic Distance Sensor:
   ```python
   from guidelens_client import send_distance
   # In your distance measurement loop:
   distance_cm = measure_distance()
   status = "danger" if distance_cm < 20 else "warning" if distance_cm < 50 else "caution" if distance_cm <= 100 else "clear"
   send_distance(distance_cm, status)
   ```

2. Object Detection (Camera / AI):
   ```python
   from guidelens_client import send_detection, send_frame
   # In your inference loop:
   send_detection("person", confidence=0.92, important=True)
   send_frame(encoded_jpeg_bytes)
   ```

3. Emergency SOS Button / GPS:
   ```python
   from guidelens_client import send_sos
   # When SOS button is pressed and GPS/Telegram processed:
   send_sos(gps_status="ok", lat=37.7749, lon=-122.4194, telegram_sent=True, telegram_error=None)
   ```

4. Background Heartbeat (start once at boot/app startup):
   ```python
   from guidelens_client import start_heartbeat
   start_heartbeat(interval=5)
   ```
"""

import os
import time
import threading
import logging
from typing import Optional, Union

try:
    import requests
except ImportError:
    # If requests is not installed yet on the Pi, fallback gracefully
    requests = None

# Configuration from Environment Variables
BASE_URL = os.environ.get("BASE_URL", os.environ.get("GUIDELENS_BASE_URL", "http://localhost:8000")).rstrip("/")
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "dev-pi-secret-key")
REQUEST_TIMEOUT = 3.0  # Strict short timeout to prevent blocking Pi threads

# Rate-limiting state
_last_distance_send_time = 0.0
_MIN_DISTANCE_INTERVAL = 0.25  # Max ~4 sends per second (1/4)

_last_frame_send_time = 0.0
_MIN_FRAME_INTERVAL = 0.33  # Max ~3 sends per second (1/3)

_rate_limit_lock = threading.Lock()
_heartbeat_thread: Optional[threading.Thread] = None
_stop_heartbeat = threading.Event()


def _get_headers(content_type: str = "application/json") -> dict:
    return {
        "X-API-Key": DEVICE_API_KEY,
        "Content-Type": content_type
    }


VERBOSE = os.environ.get("GUIDELENS_VERBOSE", "1") != "0"

def _log(msg: str):
    if VERBOSE:
        print(f"[GuideLens Client] {msg}")

def send_heartbeat() -> bool:
    """
    Sends a lightweight heartbeat ping to the backend.
    Returns True if acknowledged (HTTP 200), False on any error or timeout.
    """
    if requests is None:
        _log("requests library not installed!")
        return False
    try:
        url = f"{BASE_URL}/api/ingest/heartbeat"
        res = requests.post(url, headers=_get_headers(), timeout=REQUEST_TIMEOUT)
        if res.status_code == 200:
            _log(f"Heartbeat ACK from {BASE_URL} (Pi is Online)")
            return True
        elif res.status_code == 401:
            _log(f"401 Unauthorized: DEVICE_API_KEY ('{DEVICE_API_KEY[:4]}***') rejected by server!")
            return False
        else:
            _log(f"Heartbeat returned HTTP {res.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        _log(f"Connection failed: Cannot reach server at {BASE_URL}. Is server running and accessible?")
        return False
    except requests.exceptions.Timeout:
        _log(f"Connection timed out (> {REQUEST_TIMEOUT}s) to {BASE_URL}")
        return False
    except Exception as e:
        _log(f"Request failed: {e}")
        return False


def send_distance(distance_cm: Optional[Union[float, int]], status: str) -> bool:
    """
    Sends current obstacle distance reading and severity status.
    Rate-limited to at most ~4 sends per second.
    status must be one of: "clear", "caution", "warning", "danger", "unavailable".
    """
    global _last_distance_send_time
    if requests is None:
        return False

    # Non-blocking rate-limiting check
    now = time.monotonic()
    with _rate_limit_lock:
        if (now - _last_distance_send_time) < _MIN_DISTANCE_INTERVAL:
            return False
        _last_distance_send_time = now

    try:
        url = f"{BASE_URL}/api/ingest/distance"
        payload = {
            "distance_cm": float(distance_cm) if distance_cm is not None else None,
            "status": status.lower()
        }
        res = requests.post(url, json=payload, headers=_get_headers(), timeout=REQUEST_TIMEOUT)
        if res.status_code == 200:
            _log(f"Sent distance: {distance_cm} cm ({status}) -> 200 OK")
            return True
        elif res.status_code == 401:
            _log("401 Unauthorized sending distance!")
            return False
        return False
    except Exception as e:
        _log(f"Distance transmission failed: {e}")
        return False


def send_detection(label: str, confidence: Optional[float] = None, important: bool = False) -> bool:
    """
    Sends an AI object detection result.
    Backend handles the 10-second deduplication cooldown for the same label.
    """
    if requests is None:
        return False
    try:
        url = f"{BASE_URL}/api/ingest/detection"
        payload = {
            "label": str(label),
            "confidence": float(confidence) if confidence is not None else None,
            "important": bool(important)
        }
        res = requests.post(url, json=payload, headers=_get_headers(), timeout=REQUEST_TIMEOUT)
        return res.status_code == 200
    except Exception:
        return False


def send_sos(
    gps_status: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    telegram_sent: bool = False,
    telegram_error: Optional[str] = None
) -> bool:
    """
    Sends an Emergency SOS trigger event.
    gps_status must be one of: "ok", "timeout", "error".
    """
    if requests is None:
        return False
    try:
        url = f"{BASE_URL}/api/ingest/sos"
        payload = {
            "gps_status": gps_status.lower(),
            "latitude": float(lat) if lat is not None else None,
            "longitude": float(lon) if lon is not None else None,
            "telegram_sent": bool(telegram_sent),
            "telegram_error": str(telegram_error) if telegram_error else None
        }
        res = requests.post(url, json=payload, headers=_get_headers(), timeout=REQUEST_TIMEOUT)
        return res.status_code == 200
    except Exception:
        return False


def send_frame(jpeg_bytes: bytes) -> bool:
    """
    Sends a raw camera JPEG frame (max ~100 KB).
    Rate-limited to at most ~3 frames per second.
    """
    global _last_frame_send_time
    if requests is None or not jpeg_bytes:
        return False

    now = time.monotonic()
    with _rate_limit_lock:
        if (now - _last_frame_send_time) < _MIN_FRAME_INTERVAL:
            return False
        _last_frame_send_time = now

    try:
        url = f"{BASE_URL}/api/ingest/frame"
        headers = {
            "X-API-Key": DEVICE_API_KEY,
            "Content-Type": "image/jpeg"
        }
        res = requests.post(url, data=jpeg_bytes, headers=headers, timeout=REQUEST_TIMEOUT)
        return res.status_code == 200
    except Exception:
        return False


def _heartbeat_worker(interval: float):
    while not _stop_heartbeat.is_set():
        send_heartbeat()
        _stop_heartbeat.wait(interval)


def start_heartbeat(interval: float = 5.0) -> threading.Thread:
    """
    Starts a background daemon thread that pings the backend heartbeat every `interval` seconds (default 5s).
    """
    global _heartbeat_thread
    if _heartbeat_thread is not None and _heartbeat_thread.is_alive():
        return _heartbeat_thread

    _stop_heartbeat.clear()
    _heartbeat_thread = threading.Thread(
        target=_heartbeat_worker,
        args=(interval,),
        name="GuideLensHeartbeatWorker",
        daemon=True
    )
    _heartbeat_thread.start()
    return _heartbeat_thread


def stop_heartbeat():
    """Stops the background heartbeat worker thread if running."""
    _stop_heartbeat.set()
