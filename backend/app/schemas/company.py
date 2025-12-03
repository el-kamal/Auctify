from typing import Optional
from pydantic import BaseModel

class CompanySettingsBase(BaseModel):
    name: str
    siret: str
    address: str
    iban: str
    bic: str
    logo_url: Optional[str] = None
    logo_bordereau: Optional[str] = None
    logo_facture: Optional[str] = None
    logo_decompte: Optional[str] = None
    legal_mentions: Optional[str] = None

class CompanySettingsCreate(CompanySettingsBase):
    pass

class CompanySettingsUpdate(CompanySettingsBase):
    pass

class CompanySettings(CompanySettingsBase):
    id: int

    class Config:
        from_attributes = True
