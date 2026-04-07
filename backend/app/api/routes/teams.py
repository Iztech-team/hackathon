from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import DbSession, CurrentUser, CurrentTeam
from app.schemas.team import TeamResponse, TeamUpdate, TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse
from app.models import Team, TeamMember
from app.models.user import UserRole

router = APIRouter()


def team_to_response(team: Team) -> dict:
    scores_dict = {s.category_id: s.points for s in team.scores}
    return {
        "id": team.id,
        "team_name": team.team_name,
        "project_name": team.project_name,
        "description": team.description,
        "logo_seed": team.logo_seed,
        "created_at": team.created_at,
        "members": [
            {
                "id": m.id,
                "name": m.name,
                "phone": m.phone,
                "avatar_seed": m.avatar_seed,
            }
            for m in team.members
        ],
        "scores": scores_dict,
        "total_score": sum(scores_dict.values()),
    }


@router.get("")
async def list_teams(db: DbSession):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
        .order_by(Team.created_at.desc())
    )
    teams = result.scalars().all()
    return [team_to_response(t) for t in teams]


@router.get("/{team_id}")
async def get_team(team_id: str, db: DbSession):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
        .where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return team_to_response(team)


@router.put("/{team_id}")
async def update_team(team_id: str, data: TeamUpdate, db: DbSession, current_user: CurrentUser):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
        .where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Only team owner or admin can update
    if current_user.role != UserRole.ADMIN and team.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this team",
        )

    if data.project_name is not None:
        team.project_name = data.project_name
    if data.description is not None:
        team.description = data.description
    if data.logo_seed is not None:
        team.logo_seed = data.logo_seed

    await db.commit()
    await db.refresh(team)

    return team_to_response(team)


@router.get("/{team_id}/members")
async def get_team_members(team_id: str, db: DbSession):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members))
        .where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return [TeamMemberResponse.model_validate(m) for m in team.members]


@router.post("/{team_id}/members", response_model=TeamMemberResponse)
async def add_team_member(team_id: str, data: TeamMemberCreate, db: DbSession, current_user: CurrentUser):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Only team owner or admin can add members
    if current_user.role != UserRole.ADMIN and team.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add members to this team",
        )

    member = TeamMember(
        team_id=team_id,
        name=data.name,
        phone=data.phone,
        avatar_seed=data.avatar_seed,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return TeamMemberResponse.model_validate(member)


@router.put("/{team_id}/members/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    team_id: str,
    member_id: str,
    data: TeamMemberUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Only team owner or admin can update members
    if current_user.role != UserRole.ADMIN and team.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update members of this team",
        )

    result = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.team_id == team_id)
    )
    member = result.scalar_one_or_none()

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    if data.name is not None:
        member.name = data.name
    if data.phone is not None:
        member.phone = data.phone
    if data.avatar_seed is not None:
        member.avatar_seed = data.avatar_seed

    await db.commit()
    await db.refresh(member)

    return TeamMemberResponse.model_validate(member)


@router.delete("/{team_id}/members/{member_id}")
async def delete_team_member(
    team_id: str,
    member_id: str,
    db: DbSession,
    current_user: CurrentUser,
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Only team owner or admin can delete members
    if current_user.role != UserRole.ADMIN and team.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete members from this team",
        )

    result = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.team_id == team_id)
    )
    member = result.scalar_one_or_none()

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    await db.delete(member)
    await db.commit()

    return {"message": "Member deleted"}
