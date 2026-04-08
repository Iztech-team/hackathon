from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select
from app.api.deps import DbSession, CurrentUser
from app.rate_limit import limiter
from app.schemas.auth import Token, LoginRequest, TeamRegisterRequest, UserResponse
from app.schemas.team import TeamResponse
from app.schemas.judge import JudgeResponse
from app.services.auth import (
    authenticate_user,
    register_team,
    get_judge_by_user_id,
    get_team_by_user_id,
    get_user_by_id,
)
from app.utils.security import create_access_token
from app.models.user import UserRole
from app.models import HackathonSettings

router = APIRouter()


# Stop credential stuffing — max 10 login attempts per minute per client IP.
@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, db: DbSession):
    user = await authenticate_user(db, data.username, data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    category_id = None
    if user.role == UserRole.JUDGE:
        judge = await get_judge_by_user_id(db, user.id)
        if judge:
            category_id = judge.category_id

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        category_id=category_id,
    )

    return Token(access_token=token)


@router.post("/register/team", response_model=Token)
@limiter.limit("5/minute")
async def register_team_endpoint(request: Request, data: TeamRegisterRequest, db: DbSession):
    try:
        team, token = await register_team(db, data)
        return Token(access_token=token)
    except ValueError as e:
        msg = str(e)
        # Duplicate team name → 409 Conflict; everything else → 400
        code = (
            status.HTTP_409_CONFLICT
            if "already exists" in msg.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=code, detail=msg)


@router.get("/me")
async def get_current_user_info(current_user: CurrentUser, db: DbSession):
    user = await get_user_by_id(db, current_user.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    response = {
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
    }

    if user.role == UserRole.JUDGE:
        judge = await get_judge_by_user_id(db, user.id)
        if judge:
            response["judge"] = JudgeResponse.model_validate(judge)

    elif user.role == UserRole.TEAM:
        team = await get_team_by_user_id(db, user.id)
        if team:
            scores_dict = {s.category_id: s.points for s in team.scores}
            # Only expose the team's api_key when admin has flipped the reveal switch
            settings_row = (
                await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
            ).scalar_one_or_none()
            keys_revealed = bool(settings_row and settings_row.api_keys_revealed)
            response["team"] = {
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
                "api_key": team.api_key if keys_revealed else None,
                "api_key_assigned": team.api_key is not None,
                "api_keys_revealed": keys_revealed,
            }

    return response
