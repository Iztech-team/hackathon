from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.config import get_settings
from app.schemas.auth import TokenData
from app.models.user import UserRole

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')


def create_access_token(
    user_id: str,
    role: UserRole,
    category_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = {
        "sub": user_id,
        "role": role.value,
    }
    if category_id:
        to_encode["category_id"] = category_id

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        category_id: Optional[str] = payload.get("category_id")

        if user_id is None or role is None:
            return None

        return TokenData(
            user_id=user_id,
            role=UserRole(role),
            category_id=category_id
        )
    except JWTError:
        return None
