import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    VALIDATED = "VALIDATED"

class Invoice(Base):
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True, nullable=True) # Generated on validation
    
    buyer_id = Column(Integer, ForeignKey("actor.id"), nullable=False)
    auction_id = Column(Integer, ForeignKey("auction.id"), nullable=False)
    
    total_excl = Column(Float, nullable=False)
    total_vat = Column(Float, nullable=False)
    total_incl = Column(Float, nullable=False)
    
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    
    pdf_path = Column(String, nullable=True)
    xml_content = Column(Text, nullable=True)
    
    # Compliance / Chaining
    hash = Column(String, nullable=True)
    previous_hash = Column(String, nullable=True)
    signature_date = Column(DateTime, nullable=True)
    
    buyer = relationship("Actor", foreign_keys=[buyer_id])
    auction = relationship("Auction", foreign_keys=[auction_id])
