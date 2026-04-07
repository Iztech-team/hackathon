from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from app.api.deps import DbSession
from app.models import Team

router = APIRouter()

VALID_CATEGORIES = {"ui_ux", "frontend", "backend", "innovation", "presentation"}


@router.get("")
async def get_leaderboard(
    db: DbSession,
    category: Optional[str] = Query(None, description="Filter by category"),
):
    result = await db.execute(
        select(Team)
        .options(selectinload(Team.members), selectinload(Team.scores))
    )
    teams = result.scalars().all()

    # Build response with scores
    leaderboard = []
    for team in teams:
        scores_dict = {s.category_id: s.points for s in team.scores}

        if category and category in VALID_CATEGORIES:
            # Sort by specific category score
            sort_score = scores_dict.get(category, 0)
        else:
            # Sort by total score
            sort_score = sum(scores_dict.values())

        leaderboard.append({
            "id": team.id,
            "team_name": team.team_name,
            "project_name": team.project_name,
            "description": team.description,
            "logo_seed": team.logo_seed,
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
            "_sort_score": sort_score,  # Internal for sorting
        })

    # Sort by score descending
    leaderboard.sort(key=lambda x: x["_sort_score"], reverse=True)

    # Add rank and remove internal field
    for i, entry in enumerate(leaderboard, 1):
        entry["rank"] = i
        del entry["_sort_score"]

    return leaderboard
