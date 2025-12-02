from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.db.base import Base

class AuditLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action = Column(String, nullable=False) # e.g., "INVOICE_GENERATED"
    details = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    resource_id = Column(String, nullable=True) # ID of the resource affected
    resource_type = Column(String, nullable=True) # e.g., "INVOICE"
