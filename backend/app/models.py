from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from .database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ObstacleEvent(Base):
    __tablename__ = "obstacle_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    distance_cm = Column(Float, nullable=True)
    status = Column(String(32), nullable=False)  # clear, caution, warning, danger, unavailable
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "type": "obstacle",
            "distance_cm": self.distance_cm,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    label = Column(String(128), nullable=False)
    confidence = Column(Float, nullable=True)
    important = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "type": "detection",
            "label": self.label,
            "confidence": self.confidence,
            "important": self.important,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SOSEvent(Base):
    __tablename__ = "sos_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    gps_status = Column(String(32), nullable=False)  # ok, timeout, error
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    maps_url = Column(String(512), nullable=True)
    telegram_sent = Column(Boolean, default=False, nullable=False)
    telegram_error = Column(String(256), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "type": "sos",
            "gps_status": self.gps_status,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "maps_url": self.maps_url,
            "telegram_sent": self.telegram_sent,
            "telegram_error": self.telegram_error,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
