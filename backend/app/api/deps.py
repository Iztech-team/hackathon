from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.utils.security import decode_access_token
from app.schemas.auth import TokenData
from app.models.user import UserRole

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> TokenData:
    token = credentials.credentials
    token_data = decode_access_token(token)

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token_data


async def get_current_admin(
    current_user: Annotated[TokenData, Depends(get_current_user)],
) -> TokenData:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_current_judge(
    current_user: Annotated[TokenData, Depends(get_current_user)],
) -> TokenData:
    if current_user.role != UserRole.JUDGE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Judge access required",
        )
    return current_user


async def get_current_team(
    current_user: Annotated[TokenData, Depends(get_current_user)],
) -> TokenData:
    if current_user.role != UserRole.TEAM:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Team access required",
        )
    return current_user


# Type aliases for cleaner route signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[TokenData, Depends(get_current_user)]
CurrentAdmin = Annotated[TokenData, Depends(get_current_admin)]
CurrentJudge = Annotated[TokenData, Depends(get_current_judge)]
CurrentTeam = Annotated[TokenData, Depends(get_current_team)]
