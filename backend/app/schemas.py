from typing import Optional, List
from pydantic import BaseModel, Field

class DistanceIngest(BaseModel):
    distance_cm: Optional[float] = None
    status: str = Field(..., pattern="^(clear|caution|warning|danger|unavailable)$")

class DetectionIngest(BaseModel):
    label: str
    confidence: Optional[float] = None
    important: bool = False

class SOSIngest(BaseModel):
    gps_status: str = Field(..., pattern="^(ok|timeout|error)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    telegram_sent: bool = False
    telegram_error: Optional[str] = None

class ConfigResponse(BaseModel):
    guardian_name: str
    guardian_contact: str

class LiveDetectionItem(BaseModel):
    label: str
    confidence: Optional[float]
    important: bool
    timestamp: str

class StateResponse(BaseModel):
    pi_online: bool
    last_seen: Optional[str] = None
    seconds_since_last_seen: Optional[float] = None
    distance_cm: Optional[float] = None
    obstacle_status: Optional[str] = None
    latest_detection: Optional[LiveDetectionItem] = None
    latest_detections: List[LiveDetectionItem] = []
    camera_available: bool = False
