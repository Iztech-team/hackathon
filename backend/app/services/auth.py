from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
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
    # Check if team name already exists (case-insensitive)
    existing = await db.execute(
        select(User).where(func.lower(User.username) == func.lower(data.team_name))
    )
    if existing.scalar_one_or_none():
        raise ValueError("Team name already exists")

    # Create user account for team
    user = User(
        username=data.team_name,
        password_hash=get_password_hash(data.password),
        role=UserRole.TEAM,
    )
    db.add(user)
    await db.flush()

    # Create team profile
    team = Team(
        user_id=user.id,
        team_name=data.team_name,
        project_name=data.project_name,
        description=data.description,
        logo_seed=data.logo_seed,
    )
    db.add(team)
    await db.flush()

    # Add members
    for member_data in data.members:
        member = TeamMember(
            team_id=team.id,
            name=member_data.name,
            phone=member_data.phone,
            avatar_seed=member_data.avatar_seed,
        )
        db.add(member)

    await db.commit()
    await db.refresh(team)

    # Create access token
    token = create_access_token(user_id=user.id, role=UserRole.TEAM)

    return team, token


async def create_admin_if_not_exists(db: AsyncSession, username: str = "admin", password: str = "admin1232026"):
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none() is None:
        admin = User(
            username=username,
            password_hash=get_password_hash(password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        await db.commit()
        return True
    return False


async def create_default_judge_if_not_exists(db: AsyncSession, username: str = "judge", password: str = "judge2026"):
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none() is not None:
        return False

    user = User(
        username=username,
        password_hash=get_password_hash(password),
        role=UserRole.JUDGE,
    )
    db.add(user)
    await db.flush()

    judge = Judge(
        user_id=user.id,
        name="Judge",
        category_id="ui_ux",
        avatar_seed="judge-default",
    )
    db.add(judge)
    await db.commit()
    return True


async def create_default_team_if_not_exists(db: AsyncSession, username: str = "team", password: str = "team2026"):
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none() is not None:
        return False

    user = User(
        username=username,
        password_hash=get_password_hash(password),
        role=UserRole.TEAM,
    )
    db.add(user)
    await db.flush()

    team = Team(
        user_id=user.id,
        team_name="team",
        project_name=None,
        description=None,
        logo_seed="team-default",
    )
    db.add(team)
    await db.commit()
    return True
