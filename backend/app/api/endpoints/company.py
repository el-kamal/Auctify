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
    
    # Generate presigned URLs for logos
    # We create a copy or modify the object if it's not attached to session in a way that prevents it
    # Pydantic model conversion happens after this return, so we can modify the ORM object attributes temporarily
    # or better, convert to dict/schema and modify.
    
    # Since response_model is CompanySettingsSchema, we can return the ORM object, but if we modify it, 
    # we should be careful. 
    
    # Let's use the storage service to get presigned URLs
    if settings.logo_bordereau:
        settings.logo_bordereau = storage_service.get_presigned_url(settings.logo_bordereau)
    if settings.logo_facture:
        settings.logo_facture = storage_service.get_presigned_url(settings.logo_facture)
    if settings.logo_decompte:
        settings.logo_decompte = storage_service.get_presigned_url(settings.logo_decompte)
    if settings.logo_url:
        settings.logo_url = storage_service.get_presigned_url(settings.logo_url)
        
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
    
    # Helper to extract key from potential presigned URL
    def extract_key(url: str) -> str:
        if not url: return url
        if "r2.cloudflarestorage.com" in url or "r2.dev" in url:
            # It's likely a full URL.
            # If it has query params (presigned), strip them.
            if "?" in url:
                url = url.split("?")[0]
            
            # Now try to strip the domain part to get the key
            # This is tricky because domains vary. 
            # But we know our public base and endpoint.
            # If we just store the path, that's safer.
            # Let's assume the path after the bucket name or domain is the key.
            # Our keys start with "logos/..."
            if "/logos/" in url:
                return "logos/" + url.split("/logos/")[1]
        return url

    if not settings:
        # Sanitize inputs
        data = settings_in.dict()
        for field in ['logo_url', 'logo_bordereau', 'logo_facture', 'logo_decompte']:
            if field in data and data[field]:
                data[field] = extract_key(data[field])
                
        settings = CompanySettings(**data)
        db.add(settings)
    else:
        for field, value in settings_in.dict(exclude_unset=True).items():
            if field in ['logo_url', 'logo_bordereau', 'logo_facture', 'logo_decompte'] and value:
                value = extract_key(value)
            setattr(settings, field, value)
            
    await db.commit()
    await db.refresh(settings)
    
    # Return with presigned URLs for immediate display update
    if settings.logo_bordereau:
        settings.logo_bordereau = storage_service.get_presigned_url(settings.logo_bordereau)
    if settings.logo_facture:
        settings.logo_facture = storage_service.get_presigned_url(settings.logo_facture)
    if settings.logo_decompte:
        settings.logo_decompte = storage_service.get_presigned_url(settings.logo_decompte)
    if settings.logo_url:
        settings.logo_url = storage_service.get_presigned_url(settings.logo_url)

    return settings

from fastapi import UploadFile, File, Form
from app.services.storage_service import storage_service

@router.post("/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    type: str = Form(...), # bordereau, facture, decompte, main
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Upload a logo file and return its URL. Deletes the old logo if it exists.
    """
    # 1. Fetch current settings to find old logo
    result = await db.execute(select(CompanySettings))
    settings = result.scalars().first()

    if settings:
        old_url = None
        if type == 'bordereau':
            old_url = settings.logo_bordereau
        elif type == 'facture':
            old_url = settings.logo_facture
        elif type == 'decompte':
            old_url = settings.logo_decompte
        elif type == 'main':
            old_url = settings.logo_url
        
        if old_url:
            storage_service.delete_file(old_url)

    # 2. Upload new logo (returns key)
    key = await storage_service.upload_file(file, folder=f"logos/{type}")
    
    # Generate presigned URL for immediate display
    url = storage_service.get_presigned_url(key)
    
    return {"url": url}
