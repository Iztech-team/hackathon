"""
One-shot script to wipe ALL user data and recreate just the admin account.

After running this:
  - The `admin` account is the only user left (password from ADMIN_PASSWORD
    env var, or the dev default if unset).
  - Judges must be recreated via the admin panel.
  - Teams must re-register through the public form.

Run from the backend/ directory:
    python reseed.py
"""
import asyncio
from sqlalchemy import delete
from app.database import AsyncSessionLocal, init_db
from app.models import User, Team, Judge, TeamMember, Score, HackathonSettings
from app.services.auth import create_admin_if_not_exists


async def main():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Order matters: delete dependents first
        await db.execute(delete(Score))
        await db.execute(delete(TeamMember))
        await db.execute(delete(Judge))
        await db.execute(delete(Team))
        await db.execute(delete(User))
        # Also wipe hackathon settings so start/end/override/frozen reset
        await db.execute(delete(HackathonSettings))
        await db.commit()
        print("Wiped all users, teams, judges, members, scores, and settings.")

    async with AsyncSessionLocal() as db:
        await create_admin_if_not_exists(db)
        print("Created bootstrap admin account.")


if __name__ == "__main__":
    asyncio.run(main())
