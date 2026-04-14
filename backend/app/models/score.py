import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.orm import relationship
from app.database import Base


class Score(Base):
    __tablename__ = "scores"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(CHAR(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(String(50), nullable=False)  # innovation, visual_design, architecture, readiness
    points = Column(Integer, default=0, nullable=False)
    judge_id = Column(CHAR(36), ForeignKey("judges.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("team_id", "category_id", name="uq_team_category"),
    )

    team = relationship("Team", back_populates="scores")
    judge = relationship("Judge", backref="scores_given", lazy="joined")
