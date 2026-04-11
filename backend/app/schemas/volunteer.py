from pydantic import BaseModel, Field
from typing import Optional


class VolunteerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=4, max_length=128)
    avatar_seed: Optional[str] = None


class VolunteerResponse(BaseModel):
    id: str
    user_id: str
    name: str
    avatar_seed: Optional[str]

    class Config:
        from_attributes = True
