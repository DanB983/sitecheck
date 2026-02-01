from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class ShareReportRequest(BaseModel):
    expires_in_hours: Optional[int] = None
    
    @field_validator('expires_in_hours')
    @classmethod
    def validate_expires_in_hours(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError('expires_in_hours must be positive')
        if v is not None and v > 8760:  # Max 1 year
            raise ValueError('expires_in_hours cannot exceed 8760 (1 year)')
        return v


class ShareReportResponse(BaseModel):
    share_url: str
    token: str
    expires_at: Optional[datetime] = None


class SharedReportLinkSchema(BaseModel):
    id: UUID
    scan_id: int
    token: UUID
    expires_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

