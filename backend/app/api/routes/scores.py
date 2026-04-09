import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import selectinload
from app.api.deps import DbSession, CurrentJudge
from app.schemas.score import ScoreCreate, ScoreResponse
from app.models import Team, Score, Judge

router = APIRouter()

VALID_CATEGORIES = {"ui_ux", "frontend", "backend", "innovation"}


@router.put("/{team_id}/{category_id}", response_model=ScoreResponse)
async def set_score(
    team_id: str,
    category_id: str,
    data: ScoreCreate,
    db: DbSession,
    current_judge: CurrentJudge,
):
    # Validate category
    if category_id not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}",
        )

    # Check judge can only score their assigned category
    if current_judge.category_id != category_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You can only score the '{current_judge.category_id}' category",
        )

    # Check team exists
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Get judge record
    result = await db.execute(
        select(Judge).where(Judge.user_id == current_judge.user_id)
    )
    judge = result.scalar_one_or_none()

    if judge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge profile not found",
        )

    # Atomic upsert — INSERT ... ON CONFLICT (team_id, category_id) DO UPDATE.
    # This guarantees correctness even when two judges score the same team+category
    # concurrently, and eliminates the check-then-act race that could previously
    # produce 500s or violate the unique constraint.
    #
    # We generate the id and updated_at explicitly because SQLAlchemy's Python-level
    # column defaults (the uuid lambda, datetime.utcnow) don't fire for raw insert
    # statements — they're ORM-only.
    now = datetime.utcnow()
    stmt = sqlite_insert(Score).values(
        id=str(uuid.uuid4()),
        team_id=team_id,
        category_id=category_id,
        points=data.points,
        judge_id=judge.id,
        updated_at=now,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["team_id", "category_id"],
        set_={
            "points": stmt.excluded.points,
            "judge_id": stmt.excluded.judge_id,
            "updated_at": now,
        },
    )
    await db.execute(stmt)
    await db.commit()

    # Re-read the canonical row to return the stored values.
    result = await db.execute(
        select(Score).where(Score.team_id == team_id, Score.category_id == category_id)
    )
    score = result.scalar_one()
    return ScoreResponse.model_validate(score)


@router.get("/{team_id}")
async def get_team_scores(team_id: str, db: DbSession):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    result = await db.execute(
        select(Score)
        .options(selectinload(Score.judge))
        .where(Score.team_id == team_id)
    )
    scores = result.scalars().all()

    return [ScoreResponse.model_validate(s) for s in scores]
