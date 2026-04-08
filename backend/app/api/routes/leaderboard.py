import json
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from app.api.deps import DbSession, CurrentAdmin
from app.models import Team, HackathonSettings

router = APIRouter()


async def _build_leaderboard_payload(db, category: Optional[str] = None):
    """Build the full leaderboard response — used both for live GET and for
    snapshotting when the admin freezes the leaderboard."""
    result = await db.execute(
        select(Team).options(selectinload(Team.members), selectinload(Team.scores))
    )
    teams = result.scalars().all()

    leaderboard = []
    for team in teams:
        scores_dict = {s.category_id: s.points for s in team.scores}
        if category and category in VALID_CATEGORIES:
            sort_score = scores_dict.get(category, 0)
        else:
            sort_score = sum(scores_dict.values())
        leaderboard.append({
            "id": team.id,
            "team_name": team.team_name,
            "project_name": team.project_name,
            "description": team.description,
            "logo_seed": team.logo_seed,
            "members": [
                {"id": m.id, "name": m.name, "phone": m.phone, "avatar_seed": m.avatar_seed}
                for m in team.members
            ],
            "scores": scores_dict,
            "total_score": sum(scores_dict.values()),
            "_sort_score": sort_score,
        })

    leaderboard.sort(key=lambda x: x["_sort_score"], reverse=True)
    for i, entry in enumerate(leaderboard, 1):
        entry["rank"] = i
        del entry["_sort_score"]
    return leaderboard


class FreezeRequest(BaseModel):
    frozen: bool

VALID_CATEGORIES = {"ui_ux", "frontend", "backend", "innovation", "presentation"}


@router.get("")
async def get_leaderboard(
    db: DbSession,
    category: Optional[str] = Query(None, description="Filter by category"),
):
    return await _build_leaderboard_payload(db, category)


@router.get("/snapshot")
async def get_leaderboard_snapshot(db: DbSession):
    """Public endpoint — returns the snapshot stored at the moment the admin
    froze the leaderboard. Used by the frozen leaderboard view so participants
    can't tell whether new points were awarded during the freeze window."""
    result = await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings or not settings.leaderboard_frozen or not settings.leaderboard_snapshot:
        return {"frozen": False, "leaderboard": []}
    try:
        data = json.loads(settings.leaderboard_snapshot)
    except Exception:
        data = []
    return {"frozen": True, "leaderboard": data}


@router.put("/freeze")
async def set_freeze(
    data: FreezeRequest,
    db: DbSession,
    current_admin: CurrentAdmin,
):
    """Admin-only: freeze or unfreeze the leaderboard. On freeze we capture
    a snapshot of the current standings; on unfreeze we clear it."""
    result = await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon settings not initialized",
        )

    if data.frozen:
        snapshot = await _build_leaderboard_payload(db)
        settings.leaderboard_frozen = True
        settings.leaderboard_snapshot = json.dumps(snapshot)
    else:
        settings.leaderboard_frozen = False
        settings.leaderboard_snapshot = None

    await db.commit()
    return {
        "frozen": settings.leaderboard_frozen,
        "snapshot_size": len(json.loads(settings.leaderboard_snapshot)) if settings.leaderboard_snapshot else 0,
    }
