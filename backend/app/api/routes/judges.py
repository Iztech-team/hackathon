from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api.deps import DbSession, CurrentAdmin, CurrentUser
from app.schemas.judge import JudgeCreate, JudgeUpdate, JudgeResponse
from app.models import User, Judge, UserRole
from app.utils.security import get_password_hash

router = APIRouter()


@router.get("")
async def list_judges(db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Judge).options(selectinload(Judge.user))
    )
    judges = result.scalars().all()
    return [JudgeResponse.model_validate(j) for j in judges]


@router.post("", response_model=JudgeResponse)
async def create_judge(data: JudgeCreate, db: DbSession, current_admin: CurrentAdmin):
    # Check username doesn't exist
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    # Create user account
    user = User(
        username=data.username,
        password_hash=get_password_hash(data.password),
        role=UserRole.JUDGE,
    )
    db.add(user)
    await db.flush()

    # Create judge profile
    judge = Judge(
        user_id=user.id,
        name=data.name,
        category_id=data.category_id,
        avatar_seed=data.avatar_seed,
    )
    db.add(judge)
    await db.commit()
    await db.refresh(judge)

    return JudgeResponse.model_validate(judge)


@router.get("/{judge_id}", response_model=JudgeResponse)
async def get_judge(judge_id: str, db: DbSession, current_user: CurrentUser):
    result = await db.execute(
        select(Judge).options(selectinload(Judge.user)).where(Judge.id == judge_id)
    )
    judge = result.scalar_one_or_none()

    if judge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )

    # Only admins or the judge themselves can read this record.
    if current_user.role != UserRole.ADMIN and judge.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this judge",
        )

    return JudgeResponse.model_validate(judge)


@router.put("/{judge_id}", response_model=JudgeResponse)
async def update_judge(
    judge_id: str,
    data: JudgeUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(Judge).options(selectinload(Judge.user)).where(Judge.id == judge_id)
    )
    judge = result.scalar_one_or_none()

    if judge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )

    # Only admin or the judge themselves can update
    if current_user.role != UserRole.ADMIN and judge.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this judge",
        )

    if data.name is not None:
        judge.name = data.name
    if data.avatar_seed is not None:
        judge.avatar_seed = data.avatar_seed

    await db.commit()
    await db.refresh(judge)

    return JudgeResponse.model_validate(judge)


@router.delete("/{judge_id}")
async def delete_judge(judge_id: str, db: DbSession, current_admin: CurrentAdmin):
    result = await db.execute(
        select(Judge).options(selectinload(Judge.user)).where(Judge.id == judge_id)
    )
    judge = result.scalar_one_or_none()

    if judge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Judge not found",
        )

    # Delete user (cascades to judge)
    user = judge.user
    await db.delete(user)
    await db.commit()

    return {"message": "Judge deleted"}
