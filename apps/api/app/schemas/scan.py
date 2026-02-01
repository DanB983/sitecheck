from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional, List, Dict
from datetime import datetime
from app.models.scan import RiskLevel
from app.models.finding import FindingCategory, FindingSeverity


class FindingSchema(BaseModel):
    id: int
    category: FindingCategory
    severity: FindingSeverity
    title: str
    description: str
    recommendation: Optional[str] = None
    
    class Config:
        from_attributes = True


class ScanSchema(BaseModel):
    id: int
    user_id: Optional[int] = None
    url: str
    normalized_url: Optional[str] = None
    final_url: Optional[str] = None
    redirect_chain: Optional[List[str]] = None
    response_status: Optional[int] = None
    created_at: datetime
    overall_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    findings: List[FindingSchema] = []
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle redirect_chain JSON string"""
        import json
        data = super().from_orm(obj)
        if isinstance(data.redirect_chain, str):
            try:
                data.redirect_chain = json.loads(data.redirect_chain)
            except:
                data.redirect_chain = None
        return data
    
    class Config:
        from_attributes = True


class ScanCreateRequest(BaseModel):
    url: str
    
    @field_validator("url")
    @classmethod
    def normalize_url(cls, v: str) -> str:
        """Normalize URL: add https:// if no scheme, remove trailing slash"""
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            v = f"https://{v}"
        if v.endswith("/"):
            v = v[:-1]
        return v


class ScanCreateResponse(BaseModel):
    scan_id: int
    url: str
    overall_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    findings_count: int
    findings_by_severity: Dict[str, int] = {}
    
    class Config:
        from_attributes = True

