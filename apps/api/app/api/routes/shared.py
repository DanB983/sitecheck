from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID
import json

from app.db.database import get_db
from app.models.shared_report_link import SharedReportLink
from app.models.scan import Scan
from app.schemas.scan import ScanSchema

router = APIRouter()


@router.get("/{token}", response_model=ScanSchema)
async def get_shared_report(token: UUID, db: Session = Depends(get_db)):
    """
    Get a scan report via shared link token.
    Read-only access - no premium fields exposed.
    """
    # Look up shared link
    shared_link = db.query(SharedReportLink).filter(SharedReportLink.token == token).first()
    
    if not shared_link:
        raise HTTPException(status_code=404, detail="Shared report link not found")
    
    # Check if expired
    if shared_link.expires_at and datetime.utcnow() > shared_link.expires_at:
        raise HTTPException(
            status_code=410,
            detail="This report link has expired"
        )
    
    # Get scan
    scan = db.query(Scan).filter(Scan.id == shared_link.scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Convert redirect_chain from JSON string to list if needed
    if isinstance(scan.redirect_chain, str):
        try:
            scan.redirect_chain = json.loads(scan.redirect_chain)
        except:
            scan.redirect_chain = None
    
    # TODO: Add rate limiting here (e.g., max requests per token per hour)
    # TODO: Add analytics tracking for shared link views
    
    return scan

