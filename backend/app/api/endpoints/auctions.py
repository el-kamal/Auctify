from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api import deps
from app.models.auction import Auction, AuctionStatus
from app.models.user import User
from app.schemas.auction import AuctionCreate, AuctionUpdate, AuctionResponse

router = APIRouter()

@router.get("/", response_model=List[AuctionResponse])
async def read_auctions(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Retrieve auctions.
    """
    result = await db.execute(select(Auction).offset(skip).limit(limit))
    auctions = result.scalars().all()
    return auctions

@router.post("/", response_model=AuctionResponse)
async def create_auction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    auction_in: AuctionCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Create new auction.
    """
    auction = Auction(
        name=auction_in.name,
        date=auction_in.date,
        status=auction_in.status,
        buyer_fee_rate=auction_in.buyer_fee_rate,
    )
    db.add(auction)
    await db.commit()
    await db.refresh(auction)
    return auction

@router.get("/{id}", response_model=AuctionResponse)
async def read_auction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Get auction by ID.
    """
    result = await db.execute(select(Auction).where(Auction.id == id))
    auction = result.scalars().first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction

@router.put("/{id}", response_model=AuctionResponse)
async def update_auction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    auction_in: AuctionUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update an auction.
    """
    result = await db.execute(select(Auction).where(Auction.id == id))
    auction = result.scalars().first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    update_data = auction_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(auction, field, value)
    
    db.add(auction)
    await db.commit()
    await db.refresh(auction)
    return auction

@router.delete("/{id}", response_model=AuctionResponse)
async def delete_auction(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete an auction.
    """
    result = await db.execute(select(Auction).where(Auction.id == id))
    auction = result.scalars().first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    await db.delete(auction)
    await db.commit()
    return auction
