import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.db.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CLERK = "CLERK"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    role = Column(Enum(UserRole), default=UserRole.CLERK, nullable=False)
    is_active = Column(Boolean, default=True)
