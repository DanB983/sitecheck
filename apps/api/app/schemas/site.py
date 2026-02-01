from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from urllib.parse import urlparse


class SiteCreate(BaseModel):
    domain: str
    display_name: str
    
    @field_validator('domain')
    @classmethod
    def normalize_domain(cls, v: str) -> str:
        """Normalize domain: remove protocol, www, trailing slashes"""
        v = v.strip().lower()
        
        # Remove protocol
        if v.startswith(('http://', 'https://')):
            v = v.split('://', 1)[1]
        
        # Remove www.
        if v.startswith('www.'):
            v = v[4:]
        
        # Remove trailing slash
        v = v.rstrip('/')
        
        # Remove path if present
        parsed = urlparse(f"https://{v}")
        domain = parsed.netloc or parsed.path.split('/')[0]
        
        # Validate it looks like a domain
        if not domain or '.' not in domain:
            raise ValueError("Invalid domain format")
        
        return domain


class SiteResponse(BaseModel):
    id: int
    domain: str
    display_name: str
    created_at: datetime
    latest_scan_score: Optional[float] = None
    latest_scan_date: Optional[datetime] = None
    latest_scan_risk_level: Optional[str] = None
    
    class Config:
        from_attributes = True


class SiteListResponse(BaseModel):
    id: int
    domain: str
    display_name: str
    created_at: datetime
    latest_scan_score: Optional[float] = None
    latest_scan_date: Optional[datetime] = None
    latest_scan_risk_level: Optional[str] = None
    
    class Config:
        from_attributes = True

