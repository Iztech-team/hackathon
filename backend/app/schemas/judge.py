from pydantic import BaseModel, Field
from typing import Optional


class JudgeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=4)
    category_id: str = Field(..., pattern="^(ui_ux|frontend|backend|innovation|presentation)$")
    avatar_seed: Optional[str] = None


class JudgeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_seed: Optional[str] = None


class JudgeResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category_id: str
    avatar_seed: Optional[str]

    class Config:
        from_attributes = True
