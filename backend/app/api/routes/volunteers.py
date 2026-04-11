from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import DbSession, CurrentAdmin, CurrentUser
from app.schemas.volunteer import VolunteerCreate, VolunteerResponse
from app.models import User, Volunteer, Team, UserRole
from app.utils.security import get_password_hash

router = APIRouter()


@router.get("")
async def list_volunteers(db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Volunteer).options(selectinload(Volunteer.user))
    )
    volunteers = result.scalars().all()
    return [VolunteerResponse.model_validate(v) for v in volunteers]


@router.post("", response_model=VolunteerResponse)
async def create_volunteer(data: VolunteerCreate, db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    user = User(
        username=data.username,
        password_hash=get_password_hash(data.password),
        role=UserRole.VOLUNTEER,
    )
    db.add(user)
    await db.flush()

    volunteer = Volunteer(
        user_id=user.id,
        name=data.name,
        avatar_seed=data.avatar_seed or data.username,
    )
    db.add(volunteer)
    await db.commit()
    await db.refresh(volunteer)

    return VolunteerResponse.model_validate(volunteer)


@router.delete("/{volunteer_id}")
async def delete_volunteer(volunteer_id: str, db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Volunteer).options(selectinload(Volunteer.user)).where(Volunteer.id == volunteer_id)
    )
    volunteer = result.scalar_one_or_none()
    if volunteer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer not found",
        )

    user = volunteer.user
    await db.delete(volunteer)
    await db.flush()
    if user is not None:
        await db.delete(user)
    await db.commit()

    return {"message": "Volunteer deleted"}


@router.post("/check-in/{team_id}")
async def check_in_team(team_id: str, db: DbSession, current_user: CurrentUser):
    """Volunteer marks a team as arrived."""
    if current_user.role not in (UserRole.VOLUNTEER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteers or admins can check in teams",
        )

    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    team.arrived = True
    team.arrived_at = datetime.utcnow()
    await db.commit()

    return {"message": f"Team '{team.team_name}' checked in", "team_id": team.id}


@router.delete("/check-in/{team_id}")
async def undo_check_in(team_id: str, db: DbSession, current_user: CurrentUser):
    """Undo a team's check-in."""
    if current_user.role not in (UserRole.VOLUNTEER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteers or admins can undo check-ins",
        )

    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    team.arrived = False
    team.arrived_at = None
    await db.commit()

    return {"message": f"Team '{team.team_name}' check-in undone", "team_id": team.id}
