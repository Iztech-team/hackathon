import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.orm import relationship
from app.database import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(CHAR(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    avatar_seed = Column(String(100), nullable=True)

    team = relationship("Team", back_populates="members")
