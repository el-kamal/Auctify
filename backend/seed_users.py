import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core import security
from sqlalchemy import select

async def seed_users():
    async with AsyncSessionLocal() as db:
        # Check Admin
        result = await db.execute(select(User).where(User.email == "admin@auctify.com"))
        admin = result.scalars().first()
        if not admin:
            print("Creating Admin user...")
            admin = User(
                email="admin@auctify.com",
                hashed_password=security.get_password_hash("admin"),
                full_name="Admin User",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
        else:
            print("Admin user already exists.")

        # Check Clerk
        result = await db.execute(select(User).where(User.email == "clerk@auctify.com"))
        clerk = result.scalars().first()
        if not clerk:
            print("Creating Clerk user...")
            clerk = User(
                email="clerk@auctify.com",
                hashed_password=security.get_password_hash("clerk"),
                full_name="Clerk User",
                role=UserRole.CLERK,
                is_active=True
            )
            db.add(clerk)
        else:
            print("Clerk user already exists.")
        
        await db.commit()
        print("Seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_users())
