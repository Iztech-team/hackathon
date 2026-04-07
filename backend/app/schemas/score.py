from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ScoreCreate(BaseModel):
    points: int = Field(..., ge=0, le=15)


class ScoreResponse(BaseModel):
    id: str
    team_id: str
    category_id: str
    points: int
    judge_id: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True
