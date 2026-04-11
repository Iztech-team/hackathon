from fastapi import APIRouter, Request
from sqlalchemy import select
from app.api.deps import DbSession, CurrentUser
from app.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
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
from app.models import HackathonSettings, Volunteer

router = APIRouter()


# Stop credential stuffing — max 10 login attempts per minute per client IP.
@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, data: LoginRequest, db: DbSession):
    user = await authenticate_user(db, data.username, data.password)

    if user is None:
        raise UnauthorizedError(
            "Invalid credentials",
            code="INVALID_CREDENTIALS",
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
    # Admin kill-switch: if registration is closed, reject new team signups.
    settings_row = (
        await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
    ).scalar_one_or_none()
    if settings_row is not None and not bool(getattr(settings_row, "registration_open", True)):
        raise ForbiddenError("Registration is closed", code="REGISTRATION_CLOSED")
    try:
        team, token = await register_team(db, data)
        return Token(access_token=token)
    except ValueError as e:
        msg = str(e)
        if "already exists" in msg.lower():
            raise ConflictError(msg, code="TEAM_NAME_TAKEN")
        raise ConflictError(msg, status_code=400, code="REGISTRATION_FAILED")


@router.get("/me")
async def get_current_user_info(current_user: CurrentUser, db: DbSession):
    user = await get_user_by_id(db, current_user.user_id)

    if user is None:
        raise NotFoundError("User not found", code="USER_NOT_FOUND")

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
            # Invite link: revealed when team arrived OR admin revealed to all
            team_arrived = bool(getattr(team, 'arrived', False))
            settings_row = (
                await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
            ).scalar_one_or_none()
            global_link = getattr(settings_row, 'invite_link', None) if settings_row else None
            global_revealed = bool(getattr(settings_row, 'invite_link_revealed', False)) if settings_row else False
            show_link = team_arrived or global_revealed
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
                        "email": m.email,
                        "avatar_seed": m.avatar_seed,
                    }
                    for m in team.members
                ],
                "scores": scores_dict,
                "total_score": sum(scores_dict.values()),
                "invite_link": global_link if show_link else None,
                "invite_link_set": bool(global_link),
                "arrived": team_arrived,
            }

    elif user.role == UserRole.VOLUNTEER:
        result = await db.execute(select(Volunteer).where(Volunteer.user_id == user.id))
        volunteer = result.scalar_one_or_none()
        if volunteer:
            response["volunteer"] = {
                "id": volunteer.id,
                "name": volunteer.name,
                "avatar_seed": volunteer.avatar_seed,
            }

    return response
