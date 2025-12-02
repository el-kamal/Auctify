import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class SettlementStatus(str, enum.Enum):
    CREATED = "CREATED"
    PAID = "PAID"

class Settlement(Base):
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auction.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("actor.id"), nullable=False)
    
    amount = Column(Float, nullable=False) # Net amount to pay to seller
    status = Column(Enum(SettlementStatus), default=SettlementStatus.CREATED, nullable=False)
    
    xml_content = Column(Text, nullable=True) # Generated SEPA XML content
    created_at = Column(DateTime, default=datetime.utcnow)
    
    auction = relationship("Auction")
    seller = relationship("Actor")
