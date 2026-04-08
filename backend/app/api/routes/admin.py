import csv
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.api.deps import DbSession, CurrentAdmin
from app.models import Team, Judge, TeamMember, Score, HackathonSettings
from app.services.export import export_teams_to_csv, export_judges_to_csv, export_rankings_to_csv

router = APIRouter()

# Maximum API-keys CSV size. Uploads bigger than this are rejected before we
# allocate memory. 2 MB holds ~40,000 keys which is way more than any hackathon.
MAX_API_KEYS_CSV_BYTES = 2 * 1024 * 1024


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


# ------------------- API Key Management -------------------

async def _get_settings(db) -> HackathonSettings:
    result = await db.execute(select(HackathonSettings).where(HackathonSettings.id == 1))
    row = result.scalar_one_or_none()
    if row is None:
        from datetime import datetime
        row = HackathonSettings(
            id=1,
            start_at=datetime(2026, 4, 14, 9, 0, 0),
            end_at=datetime(2026, 4, 14, 15, 0, 0),
            override=None,
            api_keys_revealed=False,
        )
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


def _parse_keys_csv(raw: bytes) -> list[str]:
    """Parse uploaded CSV content to a list of API key strings.

    Accepts:
      - one key per line (no header)
      - CSV with a single or multiple columns; if a header row is present we
        try to locate an "api_key" / "key" column, otherwise use column 0.
    """
    text = raw.decode("utf-8-sig", errors="ignore").strip()
    if not text:
        return []

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return []

    # Use csv module to handle quoted values correctly
    reader = csv.reader(io.StringIO(text))
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    if not rows:
        return []

    header = [c.strip().lower() for c in rows[0]]
    key_col = 0
    start_idx = 0
    # Detect header row: contains "key", "api_key", or "apikey"
    if any(h in ("api_key", "apikey", "key") for h in header):
        for i, h in enumerate(header):
            if h in ("api_key", "apikey", "key"):
                key_col = i
                break
        start_idx = 1

    keys: list[str] = []
    for row in rows[start_idx:]:
        if key_col < len(row):
            val = row[key_col].strip()
            if val:
                keys.append(val)
    return keys


class ApiKeysStatusResponse(BaseModel):
    total_keys: int
    total_teams: int
    assigned: int
    revealed: bool


class RevealRequest(BaseModel):
    revealed: bool


@router.get("/api-keys/status", response_model=ApiKeysStatusResponse)
async def api_keys_status(db: DbSession, current_admin: CurrentAdmin):
    settings = await _get_settings(db)
    total_teams = (await db.execute(select(func.count(Team.id)))).scalar() or 0
    assigned = (await db.execute(
        select(func.count(Team.id)).where(Team.api_key.isnot(None))
    )).scalar() or 0
    # We don't track a separate "pool" — once assigned, each team holds its key.
    return ApiKeysStatusResponse(
        total_keys=assigned,
        total_teams=total_teams,
        assigned=assigned,
        revealed=bool(settings.api_keys_revealed),
    )


@router.post("/api-keys/upload", response_model=ApiKeysStatusResponse)
async def upload_api_keys(
    db: DbSession,
    current_admin: CurrentAdmin,
    file: UploadFile = File(...),
):
    # Validate content type (best-effort; clients can lie but most browsers set it)
    if file.content_type and file.content_type not in {
        "text/csv",
        "application/csv",
        "application/vnd.ms-excel",
        "text/plain",
        "application/octet-stream",
    }:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported content type: {file.content_type}. Expected text/csv.",
        )

    # Stream-read with a hard byte cap so a malicious upload can't OOM us.
    raw = bytearray()
    chunk_size = 64 * 1024
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        raw.extend(chunk)
        if len(raw) > MAX_API_KEYS_CSV_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"CSV file too large. Maximum size is {MAX_API_KEYS_CSV_BYTES // 1024} KB.",
            )

    keys = _parse_keys_csv(bytes(raw))
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV contained no API keys",
        )

    # Fetch all teams in creation order and assign keys
    result = await db.execute(select(Team).order_by(Team.created_at.asc()))
    teams = result.scalars().all()

    # Reset any previous assignment so re-upload fully replaces the pool
    for team in teams:
        team.api_key = None

    for team, key in zip(teams, keys):
        team.api_key = key

    await db.commit()

    settings = await _get_settings(db)
    total_teams = len(teams)
    assigned = min(len(teams), len(keys))
    return ApiKeysStatusResponse(
        total_keys=len(keys),
        total_teams=total_teams,
        assigned=assigned,
        revealed=bool(settings.api_keys_revealed),
    )


@router.put("/api-keys/reveal", response_model=ApiKeysStatusResponse)
async def set_reveal(
    data: RevealRequest,
    db: DbSession,
    current_admin: CurrentAdmin,
):
    settings = await _get_settings(db)
    settings.api_keys_revealed = bool(data.revealed)
    await db.commit()
    await db.refresh(settings)

    total_teams = (await db.execute(select(func.count(Team.id)))).scalar() or 0
    assigned = (await db.execute(
        select(func.count(Team.id)).where(Team.api_key.isnot(None))
    )).scalar() or 0
    return ApiKeysStatusResponse(
        total_keys=assigned,
        total_teams=total_teams,
        assigned=assigned,
        revealed=bool(settings.api_keys_revealed),
    )


@router.delete("/api-keys", response_model=ApiKeysStatusResponse)
async def clear_api_keys(db: DbSession, current_admin: CurrentAdmin):
    """Clear all assigned API keys and turn off reveal."""
    result = await db.execute(select(Team))
    teams = result.scalars().all()
    for team in teams:
        team.api_key = None
    settings = await _get_settings(db)
    settings.api_keys_revealed = False
    await db.commit()
    return ApiKeysStatusResponse(
        total_keys=0,
        total_teams=len(teams),
        assigned=0,
        revealed=False,
    )
