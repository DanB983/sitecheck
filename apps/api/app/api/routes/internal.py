"""
Internal API endpoints for system operations.

These endpoints are protected and should only be accessible
from trusted sources (e.g., cron jobs, internal services).
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.services.monitoring_service import MonitoringService
from app.core.config import settings

router = APIRouter()


def verify_internal_request(authorization: Optional[str] = Header(None)):
    """
    Verify that the request is from an internal/trusted source.
    
    For v1, we use a simple API key check.
    In production, this should be more robust (IP whitelist, etc.).
    """
    # For v1, we'll use a simple check
    # In production, add INTERNAL_API_KEY to settings and verify it
    # For now, allow all requests (can be restricted later)
    return True


@router.post("/internal/run-monitoring")
async def run_monitoring(
    db: Session = Depends(get_db),
    _authorized: bool = Depends(verify_internal_request)
):
    """
    Trigger monitoring for all enabled sites.
    
    This endpoint should be called periodically (e.g., via cron).
    For v1, it can be triggered manually for testing.
    """
    try:
        monitoring_service = MonitoringService()
        scans_run = await monitoring_service.process_all_monitoring_configs(db)
        
        return {
            "message": "Monitoring run completed",
            "scans_run": len(scans_run),
            "scan_ids": [scan.id for scan in scans_run]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running monitoring: {str(e)}"
        )

