from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TeamMemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    avatar_seed: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    avatar_seed: Optional[str] = None


class TeamMemberResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str]
    email: Optional[str]
    avatar_seed: Optional[str]

    class Config:
        from_attributes = True


class ScoreDetail(BaseModel):
    category_id: str
    points: int

    class Config:
        from_attributes = True


class TeamCreate(BaseModel):
    team_name: str = Field(..., min_length=1, max_length=100)
    project_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    password: str = Field(..., min_length=4)
    logo_seed: Optional[str] = None
    members: list[TeamMemberCreate] = Field(default_factory=list)


class TeamUpdate(BaseModel):
    project_name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    logo_seed: Optional[str] = None


class TeamResponse(BaseModel):
    id: str
    team_name: str
    project_name: str
    description: Optional[str]
    logo_seed: Optional[str]
    created_at: datetime
    members: list[TeamMemberResponse] = []
    scores: dict[str, int] = {}  # {category_id: points}
    total_score: int = 0

    class Config:
        from_attributes = True
