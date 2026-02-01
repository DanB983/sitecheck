from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class BrandProfileCreate(BaseModel):
    name: str
    logo_base64: Optional[str] = None
    primary_color: str = "#2563eb"
    accent_color: str = "#10b981"
    footer_text: Optional[str] = None
    
    @field_validator('primary_color', 'accent_color')
    @classmethod
    def validate_hex_color(cls, v: str) -> str:
        """Validate hex color format"""
        if not re.match(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', v):
            raise ValueError('Color must be a valid hex color (e.g., #2563eb)')
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        if len(v) > 100:
            raise ValueError('Name must be 100 characters or less')
        return v.strip()


class BrandProfileResponse(BaseModel):
    id: int
    name: str
    logo_base64: Optional[str] = None
    primary_color: str
    accent_color: str
    footer_text: Optional[str] = None
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

