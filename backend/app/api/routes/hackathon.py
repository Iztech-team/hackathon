from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from app.api.deps import DbSession, CurrentAdmin
from app.models import HackathonSettings
from app.utils.time import (
    JERUSALEM_TZ,
    to_naive_jerusalem as _to_naive_jerusalem,
    aware_jerusalem as _aware_jerusalem,
    jerusalem_now_naive as _jerusalem_now_naive,
)


router = APIRouter()


class HackathonStateResponse(BaseModel):
    start_at: datetime
    end_at: datetime
    override: Optional[str] = None
    # Derived state computed on the server: "upcoming" | "live" | "ended"
    state: str
    leaderboard_frozen: bool = False


class HackathonStateUpdate(BaseModel):
    override: Optional[str] = Field(None, pattern="^(live|ended)$")
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None


def _derive_state(settings: HackathonSettings) -> str:
    now = _jerusalem_now_naive()
    # Hard override to "ended" always wins.
    if settings.override == "ended":
        return "ended"
    # "live" override: stay live until end_at actually passes, then flip to ended automatically.
    if settings.override == "live":
        if now >= settings.end_at:
            return "ended"
        return "live"
    # No override → derive from schedule.
    if now < settings.start_at:
        return "upcoming"
    if now >= settings.end_at:
        return "ended"
    return "live"


async def _get_or_create_settings(db) -> HackathonSettings:
    result = await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
    row = result.scalar_one_or_none()
    if row is None:
        # Default: April 14 2026, 9:00 → 15:00 Jerusalem local time (6h window)
        row = HackathonSettings(
            id=1,
            start_at=datetime(2026, 4, 14, 9, 0, 0),
            end_at=datetime(2026, 4, 14, 15, 0, 0),
            override=None,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


@router.get("/state", response_model=HackathonStateResponse)
async def get_state(db: DbSession):
    settings = await _get_or_create_settings(db)
    return HackathonStateResponse(
        start_at=_aware_jerusalem(settings.start_at),
        end_at=_aware_jerusalem(settings.end_at),
        override=settings.override,
        state=_derive_state(settings),
        leaderboard_frozen=bool(settings.leaderboard_frozen),
    )


@router.put("/state", response_model=HackathonStateResponse)
async def update_state(data: HackathonStateUpdate, db: DbSession, current_admin: CurrentAdmin):
    settings = await _get_or_create_settings(db)
    # Distinguish "field not sent" from "explicit null" — Pydantic exclude_unset
    update_fields = data.model_dump(exclude_unset=True)

    if "override" in update_fields:
        settings.override = update_fields["override"]  # may be None (reset to auto)
    if "start_at" in update_fields and update_fields["start_at"] is not None:
        settings.start_at = _to_naive_jerusalem(update_fields["start_at"])
    if "end_at" in update_fields and update_fields["end_at"] is not None:
        settings.end_at = _to_naive_jerusalem(update_fields["end_at"])

    if settings.end_at <= settings.start_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_at must be after start_at",
        )

    await db.commit()
    await db.refresh(settings)

    return HackathonStateResponse(
        start_at=_aware_jerusalem(settings.start_at),
        end_at=_aware_jerusalem(settings.end_at),
        override=settings.override,
        state=_derive_state(settings),
        leaderboard_frozen=bool(settings.leaderboard_frozen),
    )
