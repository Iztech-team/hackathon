from pydantic import BaseModel, Field
from typing import Optional
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str
    role: UserRole
    category_id: Optional[str] = None  # For judges


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class TeamMemberInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_seed: Optional[str] = None


class TeamRegisterRequest(BaseModel):
    team_name: str = Field(..., min_length=1, max_length=100)
    project_name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    password: str = Field(..., min_length=4)
    logo_seed: Optional[str] = None
    members: list[TeamMemberInput] = Field(default_factory=list)


class UserResponse(BaseModel):
    id: str
    username: str
    role: UserRole

    class Config:
        from_attributes = True
