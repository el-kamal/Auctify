from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api import deps
from app.models.company import CompanySettings
from app.schemas.company import CompanySettingsCreate, CompanySettingsUpdate, CompanySettings as CompanySettingsSchema
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=CompanySettingsSchema)
async def read_company_settings(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get company settings.
    """
    result = await db.execute(select(CompanySettings))
    settings = result.scalars().first()
    if not settings:
        # Return empty or default if not found, or raise 404. 
        # For initialization, let's return a default object or 404.
        # Better to return 404 and handle in frontend or auto-create.
        raise HTTPException(status_code=404, detail="Company settings not found")
    return settings

@router.put("/", response_model=CompanySettingsSchema)
async def update_company_settings(
    *,
    db: AsyncSession = Depends(deps.get_db),
    settings_in: CompanySettingsUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update company settings (Admin only).
    """
    result = await db.execute(select(CompanySettings))
    settings = result.scalars().first()
    
    if not settings:
        settings = CompanySettings(**settings_in.dict())
        db.add(settings)
    else:
        for field, value in settings_in.dict(exclude_unset=True).items():
            setattr(settings, field, value)
            
    await db.commit()
    await db.refresh(settings)
    return settings
