import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class AuctionStatus(str, enum.Enum):
    CREATED = "CREATED"
    MAPPED = "MAPPED"
    CLOSED = "CLOSED"

class Auction(Base):
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, nullable=True) # DD-MM-YYYY-XXXX
    name = Column(String, nullable=False)  # e.g., filename "Vente Palette.xlsx"
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(AuctionStatus), default=AuctionStatus.CREATED, nullable=False)
    buyer_fee_rate = Column(Float, default=0.20, nullable=False)
    seller_fee_rate = Column(Float, default=0.05, nullable=False)
    platform_fee_rate = Column(Float, default=0.0, nullable=False)
    
    lots = relationship("Lot", back_populates="auction")
