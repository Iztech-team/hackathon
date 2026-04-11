from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from typing import Optional
from app.config import get_settings
from app.models import User, UserRole, Judge, Team, TeamMember
from app.schemas.auth import TeamRegisterRequest
from app.utils.security import verify_password, get_password_hash, create_access_token


async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]:
    # Case-insensitive username comparison
    result = await db.execute(
        select(User).where(func.lower(User.username) == func.lower(username))
    )
    user = result.scalar_one_or_none()

    if user is None:
        return None
    if not verify_password(password, user.password_hash):
        return None

    return user


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_judge_by_user_id(db: AsyncSession, user_id: str) -> Optional[Judge]:
    result = await db.execute(
        select(Judge).where(Judge.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_team_by_user_id(db: AsyncSession, user_id: str) -> Optional[Team]:
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
        .where(Team.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def register_team(db: AsyncSession, data: TeamRegisterRequest) -> tuple[Team, str]:
    # Best-effort pre-check for nicer error messages (case-insensitive).
    # The real guarantee comes from the unique constraint on User.username
    # + the IntegrityError handler below — those protect against the TOCTOU
    # race where two simultaneous registrations both pass this check.
    existing = await db.execute(
        select(User).where(func.lower(User.username) == func.lower(data.team_name))
    )
    if existing.scalar_one_or_none():
        raise ValueError("Team name already exists")

    user = User(
        username=data.team_name,
        password_hash=get_password_hash(data.password),
        role=UserRole.TEAM,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Team name already exists")

    team = Team(
        user_id=user.id,
        team_name=data.team_name,
        project_name=data.project_name,
        description=data.description,
        logo_seed=data.logo_seed,
    )
    db.add(team)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Team name already exists")

    for member_data in data.members:
        member = TeamMember(
            team_id=team.id,
            name=member_data.name,
            phone=member_data.phone,
            email=getattr(member_data, 'email', None),
            avatar_seed=member_data.avatar_seed,
        )
        db.add(member)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Team name already exists")

    await db.refresh(team)

    token = create_access_token(user_id=user.id, role=UserRole.TEAM)

    return team, token


async def create_admin_if_not_exists(db: AsyncSession, username: str = "admin", password: Optional[str] = None):
    """Bootstrap account. This is the ONLY seed account the app creates —
    judges are added by the admin via the admin panel, and teams register
    themselves through the public registration form."""
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none() is None:
        pwd = password or get_settings().ADMIN_PASSWORD
        admin = User(
            username=username,
            password_hash=get_password_hash(pwd),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        await db.commit()
        return True
    return False
