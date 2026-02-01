from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.db.database import get_db
from app.models.site import Site
from app.models.scan import Scan
from app.schemas.site import SiteCreate, SiteResponse, SiteListResponse

router = APIRouter()


@router.post("", response_model=SiteResponse, status_code=201)
async def create_site(
    site_data: SiteCreate,
    db: Session = Depends(get_db)
):
    """Create a new site"""
    # Check if site already exists
    existing_site = db.query(Site).filter(Site.domain == site_data.domain).first()
    if existing_site:
        raise HTTPException(
            status_code=409,
            detail=f"Site with domain '{site_data.domain}' already exists"
        )
    
    site = Site(
        domain=site_data.domain,
        display_name=site_data.display_name
    )
    
    db.add(site)
    db.commit()
    db.refresh(site)
    
    # Get latest scan info
    latest_scan = db.query(Scan).filter(
        Scan.site_id == site.id
    ).order_by(desc(Scan.created_at)).first()
    
    response = SiteResponse(
        id=site.id,
        domain=site.domain,
        display_name=site.display_name,
        created_at=site.created_at,
        latest_scan_score=latest_scan.overall_score if latest_scan else None,
        latest_scan_date=latest_scan.created_at if latest_scan else None,
        latest_scan_risk_level=latest_scan.risk_level.value if latest_scan and latest_scan.risk_level else None
    )
    
    return response


@router.get("", response_model=List[SiteListResponse])
async def list_sites(db: Session = Depends(get_db)):
    """List all sites with their latest scan information"""
    sites = db.query(Site).order_by(desc(Site.created_at)).all()
    
    result = []
    for site in sites:
        # Get latest scan for this site
        latest_scan = db.query(Scan).filter(
            Scan.site_id == site.id
        ).order_by(desc(Scan.created_at)).first()
        
        result.append(SiteListResponse(
            id=site.id,
            domain=site.domain,
            display_name=site.display_name,
            created_at=site.created_at,
            latest_scan_score=latest_scan.overall_score if latest_scan else None,
            latest_scan_date=latest_scan.created_at if latest_scan else None,
            latest_scan_risk_level=latest_scan.risk_level.value if latest_scan and latest_scan.risk_level else None
        ))
    
    return result


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(site_id: int, db: Session = Depends(get_db)):
    """Get a site by ID"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    # Get latest scan info
    latest_scan = db.query(Scan).filter(
        Scan.site_id == site.id
    ).order_by(desc(Scan.created_at)).first()
    
    return SiteResponse(
        id=site.id,
        domain=site.domain,
        display_name=site.display_name,
        created_at=site.created_at,
        latest_scan_score=latest_scan.overall_score if latest_scan else None,
        latest_scan_date=latest_scan.created_at if latest_scan else None,
        latest_scan_risk_level=latest_scan.risk_level.value if latest_scan and latest_scan.risk_level else None
    )


@router.get("/{site_id}/scans", response_model=List[dict])
async def get_site_scans(
    site_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent scans for a site"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    scans = db.query(Scan).filter(
        Scan.site_id == site_id
    ).order_by(desc(Scan.created_at)).limit(limit).all()
    
    result = []
    for scan in scans:
        result.append({
            "id": scan.id,
            "url": scan.url,
            "overall_score": scan.overall_score,
            "risk_level": scan.risk_level.value if scan.risk_level else None,
            "created_at": scan.created_at.isoformat() if scan.created_at else None
        })
    
    return result

