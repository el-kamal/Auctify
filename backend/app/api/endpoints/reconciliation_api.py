from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.api import deps
from app.services.reconciliation_service import ReconciliationService
from app.models.user import User
from app.models.lot import Lot, LotStatus

router = APIRouter()

@router.post("/{auction_id}/import")
async def reconcile_import(
    auction_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    try:
        stats = await ReconciliationService.reconcile_auction(db, auction_id, file)
        return {"message": "Reconciliation successful", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{auction_id}/stats")
async def get_reconciliation_stats(
    auction_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    # Count lots by status
    result = await db.execute(
        select(Lot.status, func.count(Lot.id))
        .where(Lot.auction_id == auction_id)
        .group_by(Lot.status)
    )
    stats = {row[0]: row[1] for row in result.all()}
    return stats

@router.get("/{auction_id}/results")
async def get_reconciliation_results(
    auction_id: int,
    status: str = None,
    seller_name: str = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    results = await ReconciliationService.get_results(db, auction_id, status, seller_name)
    return results

@router.get("/{auction_id}/export")
async def export_reconciliation_results(
    auction_id: int,
    status: str = None,
    seller_name: str = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    from fastapi.responses import StreamingResponse
    
    excel_file = await ReconciliationService.export_results(db, auction_id, status, seller_name)
    
    filename = f"resultats_vente_{auction_id}.xlsx"
    
    return StreamingResponse(
        excel_file, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
