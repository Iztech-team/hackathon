import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.orm import relationship
from app.database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    team_name = Column(String(100), unique=True, nullable=False, index=True)
    project_name = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    logo_seed = Column(String(100), nullable=True)
    api_key = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="team_profile", lazy="joined")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan", lazy="selectin")
    scores = relationship("Score", back_populates="team", cascade="all, delete-orphan", lazy="selectin")
