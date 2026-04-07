"""
One-shot script to wipe all user accounts and recreate just the three default ones:
  - admin / admin1232026
  - judge / judge2026  (UI/UX category)
  - team  / team2026

Run from the backend/ directory:
    python reseed.py
"""
import asyncio
from sqlalchemy import delete
from app.database import AsyncSessionLocal, init_db
from app.models import User, Team, Judge, TeamMember, Score
from app.services.auth import (
    create_admin_if_not_exists,
    create_default_judge_if_not_exists,
    create_default_team_if_not_exists,
)


async def main():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Order matters: delete dependents first
        await db.execute(delete(Score))
        await db.execute(delete(TeamMember))
        await db.execute(delete(Judge))
        await db.execute(delete(Team))
        await db.execute(delete(User))
        await db.commit()
        print("Wiped all users, teams, judges, members, scores.")

    async with AsyncSessionLocal() as db:
        await create_admin_if_not_exists(db)
        await create_default_judge_if_not_exists(db)
        await create_default_team_if_not_exists(db)
        print("Created default accounts:")
        print("  admin / admin1232026")
        print("  judge / judge2026")
        print("  team  / team2026")


if __name__ == "__main__":
    asyncio.run(main())
