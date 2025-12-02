import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base

class LotStatus(str, enum.Enum):
    CREATED = "CREATED"
    SOLD = "SOLD"
    UNSOLD = "UNSOLD"
    ANOMALIE = "ANOMALIE"

class Lot(Base):
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auction.id"), nullable=False)
    lot_number = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    hammer_price = Column(Integer, nullable=True)
    
    seller_id = Column(Integer, ForeignKey("actor.id"), nullable=True) # Nullable for Anomalies (maybe?) No, anomalies come from CSV, seller might be unknown if not mapped? Actually, if it's an anomaly, it's not in mapping, so no seller.
    buyer_id = Column(Integer, ForeignKey("actor.id"), nullable=True)
    
    status = Column(Enum(LotStatus), default=LotStatus.CREATED, nullable=False)
    
    auction = relationship("Auction", back_populates="lots")
    seller = relationship("Actor", foreign_keys=[seller_id], back_populates="lots_sold")
    buyer = relationship("Actor", foreign_keys=[buyer_id], back_populates="lots_bought")
