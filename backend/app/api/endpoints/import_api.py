from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.services.import_service import ImportService
from app.models.user import User

router = APIRouter()

@router.post("/mapping/{auction_id}")
async def import_mapping(
    auction_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")
    
    try:
        auction, imported_items = await ImportService.import_mapping_for_auction(db, auction_id, file)
        return {
            "message": "Import successful", 
            "auction_id": auction.id, 
            "auction_name": auction.name,
            "imported_items": imported_items
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
