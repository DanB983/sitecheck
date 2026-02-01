from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.db.database import Base


class BrandProfile(Base):
    __tablename__ = "brand_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    logo_base64 = Column(Text, nullable=True)  # Base64 encoded image
    primary_color = Column(String, nullable=False, default="#2563eb")  # Hex color
    accent_color = Column(String, nullable=False, default="#10b981")  # Hex color
    footer_text = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

