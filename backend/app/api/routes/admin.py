from fastapi import APIRouter
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.api.deps import DbSession, CurrentAdmin
from app.models import Team, Judge, TeamMember, Score
from app.services.export import export_teams_to_csv, export_judges_to_csv, export_rankings_to_csv

router = APIRouter()


@router.get("/stats")
async def get_stats(db: DbSession, current_admin: CurrentAdmin):
    # Total teams
    result = await db.execute(select(func.count(Team.id)))
    total_teams = result.scalar()

    # Total participants (team members)
    result = await db.execute(select(func.count(TeamMember.id)))
    total_participants = result.scalar()

    # Total judges
    result = await db.execute(select(func.count(Judge.id)))
    total_judges = result.scalar()

    # Total points awarded
    result = await db.execute(select(func.sum(Score.points)))
    total_points = result.scalar() or 0

    return {
        "total_teams": total_teams,
        "total_participants": total_participants,
        "total_judges": total_judges,
        "total_points": total_points,
    }


@router.get("/export/teams")
async def export_teams(db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
    )
    teams = result.scalars().all()

    csv_content = export_teams_to_csv(teams)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=teams.csv"},
    )


@router.get("/export/judges")
async def export_judges(db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Judge).options(selectinload(Judge.user))
    )
    judges = result.scalars().all()

    csv_content = export_judges_to_csv(judges)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=judges.csv"},
    )


@router.get("/export/rankings")
async def export_rankings(db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
    )
    teams = result.scalars().all()

    csv_content = export_rankings_to_csv(teams)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rankings.csv"},
    )
