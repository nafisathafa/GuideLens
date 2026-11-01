import time
from datetime import datetime, timezone
from typing import Optional, List, Dict, Tuple

OFFLINE_THRESHOLD_SECONDS = 15.0
CAMERA_TIMEOUT_SECONDS = 10.0
DETECTION_COOLDOWN_SECONDS = 10.0

class InMemoryState:
    def __init__(self):
        self.last_seen_time: Optional[float] = None
        self.last_seen_iso: Optional[str] = None
        
        # Live readings
        self.current_distance_cm: Optional[float] = None
        self.current_obstacle_status: Optional[str] = None
        
        # Deduplication / event storage tracking
        self.last_saved_obstacle_status: Optional[str] = None
        self.label_last_saved_time: Dict[str, float] = {}
        
        # Camera
        self.latest_frame_bytes: Optional[bytes] = None
        self.latest_frame_time: Optional[float] = None
        
        # Detections
        self.recent_detections: List[dict] = []  # max 10
        
        # Track previous online state for edge transition detection
        self.prev_online_state: bool = False

    def touch(self):
        """Update the last_seen_time whenever ANY ingest message is received."""
        self.last_seen_time = time.time()
        self.last_seen_iso = datetime.now(timezone.utc).isoformat()

    def is_pi_online(self) -> bool:
        if self.last_seen_time is None:
            return False
        return (time.time() - self.last_seen_time) <= OFFLINE_THRESHOLD_SECONDS

    def is_camera_available(self) -> bool:
        if not self.is_pi_online() or self.latest_frame_time is None or self.latest_frame_bytes is None:
            return False
        return (time.time() - self.latest_frame_time) <= CAMERA_TIMEOUT_SECONDS

    def update_distance(self, distance_cm: Optional[float], status: str) -> bool:
        """
        Updates live distance and status.
        Returns True if this represents a status change that should be stored in DB.
        """
        self.touch()
        self.current_distance_cm = distance_cm
        self.current_obstacle_status = status
        
        should_store = False
        if status != self.last_saved_obstacle_status:
            should_store = True
            self.last_saved_obstacle_status = status
            
        return should_store

    def record_detection(self, label: str, confidence: Optional[float], important: bool) -> Tuple[bool, dict]:
        """
        Updates in-memory detection.
        Returns (should_store, detection_dict).
        should_store is True only if outside the 10s cooldown for this label.
        """
        self.touch()
        now = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        detection_data = {
            "label": label,
            "confidence": confidence,
            "important": important,
            "timestamp": now_iso
        }
        
        # Update live list
        self.recent_detections.insert(0, detection_data)
        if len(self.recent_detections) > 20:
            self.recent_detections.pop()
            
        # Check cooldown for database persistence
        last_saved = self.label_last_saved_time.get(label)
        if last_saved is None or (now - last_saved) >= DETECTION_COOLDOWN_SECONDS:
            self.label_last_saved_time[label] = now
            should_store = True
        else:
            should_store = False
            
        return should_store, detection_data

    def update_frame(self, frame_bytes: bytes):
        self.touch()
        self.latest_frame_bytes = frame_bytes
        self.latest_frame_time = time.time()

    def get_state(self) -> dict:
        online = self.is_pi_online()
        now = time.time()
        
        seconds_since_last_seen = None
        if self.last_seen_time is not None:
            seconds_since_last_seen = round(now - self.last_seen_time, 1)

        # When offline: distance is null, status is unavailable, never stale
        if online:
            distance = self.current_distance_cm
            status = self.current_obstacle_status or "clear"
        else:
            distance = None
            status = "unavailable"

        cam_avail = self.is_camera_available()
        latest_det = self.recent_detections[0] if (online and self.recent_detections) else None

        return {
            "pi_online": online,
            "last_seen": self.last_seen_iso,
            "seconds_since_last_seen": seconds_since_last_seen,
            "distance_cm": distance,
            "obstacle_status": status,
            "latest_detection": latest_det,
            "latest_detections": self.recent_detections[:5] if online else [],
            "camera_available": cam_avail
        }

live_state = InMemoryState()
