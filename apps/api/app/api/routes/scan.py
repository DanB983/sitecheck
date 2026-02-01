from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DatabaseError
from typing import List, Dict, Optional
from collections import Counter
import json

from app.db.database import get_db
from app.models.scan import Scan, RiskLevel
from app.models.finding import Finding, FindingCategory, FindingSeverity
from app.models.brand_profile import BrandProfile
from app.models.shared_report_link import SharedReportLink
from app.models.site import Site
from urllib.parse import urlparse
from app.schemas.scan import (
    ScanCreateRequest,
    ScanCreateResponse,
    ScanSchema
)
from app.schemas.explanation import ExplanationResponse
from app.schemas.shared_report_link import ShareReportRequest, ShareReportResponse
from app.services.scanner import ScannerService
from app.services.llm_client import get_llm_client
from app.services.pdf_generator import PDFGenerator
from app.core.config import settings

router = APIRouter()


def extract_domain_from_url(url: str) -> str:
    """Extract normalized domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        
        return domain.lower()
    except Exception:
        return ""


@router.post("", response_model=ScanCreateResponse)
async def create_scan(
    request: ScanCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new scan for the given URL"""
    try:
        # Extract domain and find or create site
        domain = extract_domain_from_url(request.url)
        site = None
        
        if domain:
            # Try to find existing site
            site = db.query(Site).filter(Site.domain == domain).first()
            
            # If not found, auto-create site
            if not site:
                site = Site(
                    domain=domain,
                    display_name=domain  # Default to domain as display name
                )
                db.add(site)
                db.flush()
        
        # Create scan record
        scan = Scan(url=request.url, user_id=None, site_id=site.id if site else None)
        db.add(scan)
        db.flush()  # Get scan.id
        
        # Run scan
        scanner = ScannerService()
        scan_result = await scanner.scan_url(request.url)
        
        # Update scan with metadata
        scan.normalized_url = scan_result.normalized_url
        scan.final_url = scan_result.final_url
        # Store redirect_chain as JSON string for SQLite compatibility
        scan.redirect_chain = json.dumps(scan_result.redirect_chain) if scan_result.redirect_chain else None
        scan.response_status = scan_result.response_status
        scan.overall_score = scan_result.overall_score
        scan.risk_level = RiskLevel(scan_result.risk_level) if scan_result.risk_level else None
        
        # Create findings
        for finding_data in scan_result.findings:
            finding = Finding(
                scan_id=scan.id,
                category=finding_data["category"],
                severity=finding_data["severity"],
                title=finding_data["title"],
                description=finding_data["description"],
                recommendation=finding_data.get("recommendation")
            )
            db.add(finding)
        
        # Count findings by severity
        severity_counts = Counter(f["severity"].value for f in scan_result.findings)
        findings_by_severity = {
            "critical": severity_counts.get(FindingSeverity.CRITICAL.value, 0),
            "high": severity_counts.get(FindingSeverity.HIGH.value, 0),
            "medium": severity_counts.get(FindingSeverity.MEDIUM.value, 0),
            "low": severity_counts.get(FindingSeverity.LOW.value, 0),
            "info": severity_counts.get(FindingSeverity.INFO.value, 0),
        }
        
        db.commit()
        db.refresh(scan)
        
        return ScanCreateResponse(
            scan_id=scan.id,
            url=scan.url,
            overall_score=scan.overall_score,
            risk_level=scan.risk_level,
            findings_count=len(scan_result.findings),
            findings_by_severity=findings_by_severity
        )
    except (OperationalError, DatabaseError) as e:
        # Database connection error
        db.rollback()
        import traceback
        print(f"Database error creating scan: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=503,
            detail="Database connection failed. Please ensure Docker and PostgreSQL are running."
        )
    except Exception as e:
        # Rollback on error
        db.rollback()
        # Log the error for debugging
        import traceback
        print(f"Error creating scan: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create scan: {str(e)}"
        )


@router.get("/{scan_id}", response_model=ScanSchema)
async def get_scan(scan_id: int, db: Session = Depends(get_db)):
    """Get a scan report by ID"""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Convert redirect_chain from JSON string to list if needed
    if isinstance(scan.redirect_chain, str):
        try:
            scan.redirect_chain = json.loads(scan.redirect_chain)
        except:
            scan.redirect_chain = None
    
    return scan


@router.get("/{scan_id}/explain", response_model=ExplanationResponse)
async def explain_scan(scan_id: int, db: Session = Depends(get_db)):
    """Generate AI explanation for a scan report"""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Prepare scan report data for LLM
    findings_data = []
    for finding in scan.findings:
        findings_data.append({
            "severity": finding.severity.value,
            "category": finding.category.value,
            "title": finding.title,
            "description": finding.description,
            "recommendation": finding.recommendation
        })
    
    scan_report = {
        "overall_score": scan.overall_score,
        "risk_level": scan.risk_level.value if scan.risk_level else None,
        "url": scan.url,
        "findings": findings_data
    }
    
    # Get LLM client and generate explanation
    llm_client = get_llm_client()
    explanation = await llm_client.generate_explanation(scan_report)
    
    return ExplanationResponse(**explanation)


@router.get("/{scan_id}/pdf")
async def get_scan_pdf(
    scan_id: int,
    mode: Optional[str] = Query(None, description="PDF mode: 'branded' or default"),
    brand_id: Optional[int] = Query(None, description="Brand profile ID for branded PDF"),
    db: Session = Depends(get_db)
):
    """Generate PDF report for a scan"""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Premium gate for branded PDFs
    if mode == "branded":
        if not settings.enable_branded_pdf:
            raise HTTPException(
                status_code=402,
                detail="Branded PDFs are a premium feature."
            )
        
        if not brand_id:
            raise HTTPException(
                status_code=400,
                detail="brand_id is required for branded PDF mode"
            )
        
        brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Brand profile not found")
        
        pdf_bytes = PDFGenerator.generate_pdf(scan, brand)
        
        # Generate filename
        from urllib.parse import urlparse
        domain = urlparse(scan.url).netloc.replace('.', '-') if scan.url else 'unknown'
        filename = f"sitecheck-branded-report-{brand.name.lower().replace(' ', '-')}-{domain}-{scan.created_at.strftime('%Y%m%d')}.pdf"
        
        return Response(
            content=pdf_bytes.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    else:
        # Neutral/default PDF
        pdf_bytes = PDFGenerator.generate_pdf(scan)
        
        from urllib.parse import urlparse
        domain = urlparse(scan.url).netloc.replace('.', '-') if scan.url else 'unknown'
        filename = f"sitecheck-report-{domain}-{scan.created_at.strftime('%Y%m%d')}.pdf"
        
        return Response(
            content=pdf_bytes.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

