"""
Seed volunteer accounts from the hackathon-day volunteer roster.

Each volunteer gets:
  username = firstname (lowercase)
  password = Firstname2026

Run from the backend/ directory:
    python seed_volunteers.py
"""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import User, Volunteer
from app.models.user import UserRole
from app.utils.security import get_password_hash

VOLUNTEERS = [
    "Husam Essa",
    "Lamees Khlawi",
    "Osama Shawabkeh",
    "Ali Haslamoun",
    "Sadeel Kafisha",
    "Remeem Jabari",
    "Firas Amro",
    "Rawaa Manasra",
    "Hamza Taradeh",
    "Kareem Atawneh",
    "Momen Awawdeh",
    "Bara Hawamdeh",
    "Jihad Khamayseh",
    "Walaa Khdoor",
    "Asia Jadallah",
]


async def main():
    await init_db()
    async with AsyncSessionLocal() as db:
        created = 0
        skipped = 0

        for full_name in VOLUNTEERS:
            first_name = full_name.split()[0]
            username = first_name.lower()
            password = f"{first_name}2026"

            # Skip if username already exists
            existing = await db.execute(select(User).where(User.username == username))
            if existing.scalar_one_or_none():
                print(f"  SKIP  {username} (already exists)")
                skipped += 1
                continue

            user = User(
                username=username,
                password_hash=get_password_hash(password),
                role=UserRole.VOLUNTEER,
            )
            db.add(user)
            await db.flush()

            volunteer = Volunteer(
                user_id=user.id,
                name=full_name,
            )
            db.add(volunteer)
            created += 1
            print(f"  OK    {username} / {password}  →  {full_name}")

        await db.commit()
        print(f"\nDone: {created} created, {skipped} skipped.")


if __name__ == "__main__":
    asyncio.run(main())
