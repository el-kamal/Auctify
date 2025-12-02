from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class CompanySettings(Base):
    __tablename__ = "company_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    siret = Column(String, nullable=False)
    address = Column(String, nullable=False)
    iban = Column(String, nullable=False)
    bic = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    legal_mentions = Column(Text, nullable=True)
