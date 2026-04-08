"""Time helpers.

Timezone convention for this codebase
=====================================

SQLAlchemy DateTime columns in this app are **naive Jerusalem local time**
for the hackathon_settings table (so admin-configured start/end times match
the wall clock in the venue), and **naive UTC** for transient timestamps like
`created_at` and `updated_at` that only exist for audit/display.

Mixing the two is a footgun — never compare `datetime.utcnow()` directly
against a `HackathonSettings.start_at` value. Use the helpers below instead.
"""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


# Physical location of the hackathon. Change this if the event moves.
JERUSALEM_TZ = ZoneInfo("Asia/Jerusalem")


def utc_now_naive() -> datetime:
    """Current moment as a naive UTC datetime — matches the convention used by
    the default value for created_at columns (`datetime.utcnow`)."""
    return datetime.utcnow()


def jerusalem_now_naive() -> datetime:
    """Current moment as a naive Jerusalem-local datetime — matches the
    convention used by hackathon_settings.start_at / end_at."""
    return datetime.now(JERUSALEM_TZ).replace(tzinfo=None)


def to_naive_jerusalem(dt: datetime) -> datetime:
    """Normalize any incoming datetime to naive Jerusalem local.

    - Aware datetimes are first converted to Jerusalem, then stripped of tz.
    - Naive datetimes are assumed to ALREADY be Jerusalem local (the convention
      for how clients send times in this app).
    """
    if dt.tzinfo is not None:
        return dt.astimezone(JERUSALEM_TZ).replace(tzinfo=None)
    return dt


def aware_jerusalem(dt: datetime) -> datetime:
    """Tag a naive Jerusalem-local datetime with Jerusalem tzinfo so pydantic
    serializes it with the correct offset (e.g. +03:00 during DST)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=JERUSALEM_TZ)
    return dt.astimezone(JERUSALEM_TZ)
