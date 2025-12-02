from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.settlement import Settlement, SettlementStatus
from app.models.lot import Lot, LotStatus
from app.models.auction import Auction
from app.models.actor import Actor
from app.services.sepa_service import SEPAService

router = APIRouter()

@router.post("/{auction_id}/generate")
async def generate_settlements(
    auction_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
):
    # 1. Get Auction
    auction = await db.get(Auction, auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
        
    # 2. Get SOLD Lots
    result = await db.execute(
        select(Lot)
        .options(selectinload(Lot.seller))
        .where(
            Lot.auction_id == auction_id, 
            Lot.status == LotStatus.SOLD,
            Lot.seller_id.isnot(None)
        )
    )
    lots = result.scalars().all()
    
    if not lots:
        raise HTTPException(status_code=400, detail="No sold lots found to settle")

    # Group by Seller
    lots_by_seller = {}
    for lot in lots:
        if lot.seller_id not in lots_by_seller:
            lots_by_seller[lot.seller_id] = []
        lots_by_seller[lot.seller_id].append(lot)
        
    generated_count = 0
    new_settlements = []
    
    for seller_id, seller_lots in lots_by_seller.items():
        # Calculate Total Amount Due
        # Amount = Hammer Price - Seller Fees (if any)
        # For now, let's assume Seller Fees are 0 or handled elsewhere, 
        # or we just pay the Hammer Price minus commission?
        # The prompt didn't specify Seller Fees, only Buyer Fees.
        # Let's assume we pay the full Hammer Price for now, or maybe deduct a standard seller commission?
        # Let's assume 10% seller commission for realism, or 0 if not specified.
        # I'll stick to 0 for simplicity unless specified.
        
        total_amount = sum(lot.hammer_price or 0 for lot in seller_lots)
        
        # Create Settlement
        settlement = Settlement(
            auction_id=auction_id,
            seller_id=seller_id,
            amount=total_amount,
            status=SettlementStatus.CREATED
        )
        db.add(settlement)
        new_settlements.append(settlement)
        generated_count += 1
    
    await db.flush()
    
    # Generate SEPA XML for all new settlements
    # We need to reload settlements with relationships to generate XML
    # Or just use the objects we have (we need seller info which is in lots[0].seller)
    # But we didn't attach seller to settlement object yet (it's in session).
    # Let's fetch them properly or assume we can access via relationship if loaded.
    
    # To be safe, let's generate one global XML for the batch?
    # Or one XML per settlement? Usually one XML file containing multiple transactions.
    # Let's generate one XML for this generation run.
    
    # We need to populate the `seller` relationship on the settlement objects
    for s in new_settlements:
        # Find seller from lots
        s.seller = lots_by_seller[s.seller_id][0].seller
        s.auction = auction
        
    xml_content = SEPAService.generate_sepa_xml(new_settlements)
    
    # Store XML in each settlement? Or just one?
    # Usually we store the file and link it.
    # For now, let's store the content in each settlement for simplicity, or just the first one?
    # Or maybe we need a "SettlementBatch" model?
    # Given the constraints, I'll store the same XML content in all settlements of this batch, 
    # or just return it to the user.
    # The requirement says "Download SEPA XML".
    # I'll store it in the first settlement or all.
    for s in new_settlements:
        s.xml_content = xml_content
        
    await db.commit()
    
    return {"message": f"Generated {generated_count} settlements", "xml_content": xml_content}

@router.get("/{auction_id}/list")
async def list_settlements(
    auction_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user),
):
    result = await db.execute(
        select(Settlement)
        .options(selectinload(Settlement.seller))
        .where(Settlement.auction_id == auction_id)
    )
    settlements = result.scalars().all()
    return settlements
