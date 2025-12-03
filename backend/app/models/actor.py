import enum
from sqlalchemy import Column, Integer, String, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class ActorType(str, enum.Enum):
    SELLER = "SELLER"
    BUYER = "BUYER"

class Actor(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(Enum(ActorType), nullable=False)
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    siren_siret = Column(String, nullable=True)
    address = Column(String, nullable=True)
    iban = Column(String, nullable=True)
    bic = Column(String, nullable=True)
    vat_subject = Column(Boolean, default=False, nullable=False)
    
    lots_sold = relationship("Lot", back_populates="seller", foreign_keys="Lot.seller_id")
    lots_bought = relationship("Lot", back_populates="buyer", foreign_keys="Lot.buyer_id")
