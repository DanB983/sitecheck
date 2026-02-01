from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.alert import AlertType


class AlertResponse(BaseModel):
    id: int
    site_id: int
    scan_id: int
    alert_type: AlertType
    message: str
    created_at: datetime
    site_domain: Optional[str] = None
    site_display_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class AlertGroupedResponse(BaseModel):
    """Alerts grouped by site"""
    site_id: int
    site_domain: str
    site_display_name: str
    alerts: list[AlertResponse]
    
    class Config:
        from_attributes = True

