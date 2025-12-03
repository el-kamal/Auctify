from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.auction import AuctionStatus

class AuctionBase(BaseModel):
    name: str
    number: Optional[str] = None
    date: Optional[datetime] = None
    status: AuctionStatus = AuctionStatus.CREATED
    buyer_fee_rate: float = 0.20
    seller_fee_rate: float = 0.05

class AuctionCreate(AuctionBase):
    pass

class AuctionUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[AuctionStatus] = None
    buyer_fee_rate: Optional[float] = None
    seller_fee_rate: Optional[float] = None

class AuctionResponse(AuctionBase):
    id: int
    number: Optional[str] = None

    class Config:
        from_attributes = True
