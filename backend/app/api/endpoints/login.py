from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, UserRole

router = APIRouter()

@router.post("/login/access-token")
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # 1. Find user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    # 2. Validate user and password
    # For this demo, if user doesn't exist, we might auto-create admin/clerk for testing?
    # Or just fail. Let's fail but provide a way to seed.
    # Actually, for the demo to work immediately, let's auto-create if table is empty or specific emails.
    
    if not user:
        # Mock users for demo purposes if they don't exist
        if form_data.username == "admin@auctify.com" and form_data.password == "admin":
            user = User(
                email="admin@auctify.com", 
                hashed_password=security.get_password_hash("admin"),
                full_name="Admin User",
                role=UserRole.ADMIN
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        elif form_data.username == "clerk@auctify.com" and form_data.password == "clerk":
            user = User(
                email="clerk@auctify.com", 
                hashed_password=security.get_password_hash("clerk"),
                full_name="Clerk User",
                role=UserRole.CLERK
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role, # Return role for frontend
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }
