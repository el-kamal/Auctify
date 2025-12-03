from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Auctify"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"]

    # R2 Storage
    R2_ACCOUNT_ID: str = "022e575b16ec102a7b0a22626a0987f2"
    R2_ACCESS_KEY_ID: str = "70ca25ef627b6c6388a2225d97050236"
    R2_SECRET_ACCESS_KEY: str = "19e9d1950c25a672cf057cfd685bcc75ff3fec6598690c46a84e4e8a9083983b"
    R2_BUCKET: str = "auctify"
    R2_REGION: str = "auto"
    R2_ENDPOINT: str = "https://022e575b16ec102a7b0a22626a0987f2.r2.cloudflarestorage.com"
    R2_PUBLIC_BASE: str = "https://pub-022e575b16ec102a7b0a22626a0987f2.r2.dev"
    
    class Config:
        env_file = ".env"

settings = Settings()
