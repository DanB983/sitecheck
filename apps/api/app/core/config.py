from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    DATABASE_URL: str
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True
    CORS_ORIGINS: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    
    # LLM
    LLM_PROVIDER: str = "stub"
    OPENAI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    
    # Premium features
    ENABLE_BRANDED_PDF: str = "false"  # Set to "true" to enable branded PDFs
    
    @property
    def enable_branded_pdf(self) -> bool:
        """Parse ENABLE_BRANDED_PDF as boolean"""
        return self.ENABLE_BRANDED_PDF.lower() == "true"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

