import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.sqlite import CHAR
from sqlalchemy.orm import relationship
from app.database import Base


class Judge(Base):
    __tablename__ = "judges"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    category_id = Column(String(50), nullable=False)  # ui_ux, frontend, backend, innovation, presentation
    avatar_seed = Column(String(100), nullable=True)

    user = relationship("User", backref="judge_profile", lazy="joined")
