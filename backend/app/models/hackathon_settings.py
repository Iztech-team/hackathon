from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class HackathonSettings(Base):
    """Singleton-style settings row for the hackathon state.

    `override`:
        - None   => use timestamps to derive state (upcoming/live/ended)
        - "live" => force state to live (admin started early)
        - "ended"=> force state to ended (admin ended early)
    """
    __tablename__ = "hackathon_settings"

    id = Column(Integer, primary_key=True, default=1)
    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    override = Column(String(16), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
