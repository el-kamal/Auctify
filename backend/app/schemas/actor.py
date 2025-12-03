from typing import Optional
from pydantic import BaseModel
from app.models.actor import ActorType

class ActorBase(BaseModel):
    name: str
    type: ActorType
    email: Optional[str] = None
    phone_number: Optional[str] = None
    siren_siret: Optional[str] = None
    address: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    vat_subject: bool = False

class ActorCreate(ActorBase):
    pass

class ActorUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ActorType] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    siren_siret: Optional[str] = None
    address: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    vat_subject: Optional[bool] = None

class ActorInDBBase(ActorBase):
    id: int

    class Config:
        from_attributes = True

class Actor(ActorInDBBase):
    pass
