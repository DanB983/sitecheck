from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.monitoring_config import MonitoringFrequency


class MonitoringConfigCreate(BaseModel):
    frequency: MonitoringFrequency = MonitoringFrequency.WEEKLY
    enabled: bool = False


class MonitoringConfigUpdate(BaseModel):
    frequency: Optional[MonitoringFrequency] = None
    enabled: Optional[bool] = None


class MonitoringConfigResponse(BaseModel):
    id: int
    site_id: int
    frequency: MonitoringFrequency
    enabled: bool
    last_run_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

