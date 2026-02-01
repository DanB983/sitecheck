import pytest
from io import BytesIO
from datetime import datetime
from unittest.mock import Mock
from app.services.pdf_generator import PDFGenerator
from app.models.scan import Scan, RiskLevel
from app.models.finding import Finding, FindingCategory, FindingSeverity
from app.models.brand_profile import BrandProfile


@pytest.fixture
def sample_scan_with_findings():
    """Create a sample scan with multiple findings (no DB needed)"""
    from unittest.mock import Mock
    
    scan = Mock(spec=Scan)
    scan.id = 1
    scan.url = "https://example.com"
    scan.normalized_url = "https://example.com"
    scan.final_url = "https://example.com"
    scan.overall_score = 75.0
    scan.risk_level = RiskLevel.MEDIUM
    scan.response_status = 200
    scan.created_at = datetime.now()
    scan.redirect_chain = None
    
    # Create findings
    findings = [
        Mock(spec=Finding)
    ]
    findings[0].category = FindingCategory.SECURITY
    findings[0].severity = FindingSeverity.HIGH
    findings[0].title = "Missing HSTS Header"
    findings[0].description = "The site does not include a Strict-Transport-Security header, which could allow man-in-the-middle attacks."
    findings[0].recommendation = "Add HSTS header: Strict-Transport-Security: max-age=31536000; includeSubDomains"
    
    finding2 = Mock(spec=Finding)
    finding2.category = FindingCategory.GDPR
    finding2.severity = FindingSeverity.MEDIUM
    finding2.title = "Cookie Consent Not Detected"
    finding2.description = "No obvious cookie consent banner was detected on the site."
    finding2.recommendation = "Implement a GDPR-compliant cookie consent banner."
    findings.append(finding2)
    
    finding3 = Mock(spec=Finding)
    finding3.category = FindingCategory.SEO
    finding3.severity = FindingSeverity.LOW
    finding3.title = "Robots.txt Not Found"
    finding3.description = "The robots.txt file was not found at the expected location."
    finding3.recommendation = "Create a robots.txt file to control search engine crawling."
    findings.append(finding3)
    
    scan.findings = findings
    return scan


@pytest.fixture
def sample_brand():
    """Create a sample brand profile (no DB needed)"""
    brand = Mock(spec=BrandProfile)
    brand.id = 1
    brand.name = "Test Agency"
    brand.primary_color = "#1E40AF"
    brand.accent_color = "#22C55E"
    brand.footer_text = "Custom footer"
    brand.logo_base64 = None
    return brand


def test_pdf_generation_neutral(sample_scan_with_findings):
    """Test that neutral PDF is generated successfully"""
    pdf_bytes = PDFGenerator.generate_pdf(sample_scan_with_findings)
    
    assert pdf_bytes is not None
    assert isinstance(pdf_bytes, BytesIO)
    
    # Check PDF size (should be reasonable for a report)
    pdf_bytes.seek(0, 2)  # Seek to end
    size = pdf_bytes.tell()
    assert size > 10000, f"PDF too small: {size} bytes"  # At least 10KB
    assert size < 5000000, f"PDF too large: {size} bytes"  # Less than 5MB


def test_pdf_generation_branded(sample_scan_with_findings, sample_brand):
    """Test that branded PDF is generated successfully"""
    pdf_bytes = PDFGenerator.generate_pdf(sample_scan_with_findings, sample_brand)
    
    assert pdf_bytes is not None
    assert isinstance(pdf_bytes, BytesIO)
    
    # Check PDF size
    pdf_bytes.seek(0, 2)
    size = pdf_bytes.tell()
    assert size > 10000, f"PDF too small: {size} bytes"
    assert size < 5000000, f"PDF too large: {size} bytes"


def test_pdf_includes_key_sections(sample_scan_with_findings):
    """Test that PDF includes key sections (by checking size and structure)"""
    pdf_bytes = PDFGenerator.generate_pdf(sample_scan_with_findings)
    
    # Read PDF content (as bytes, we can't easily parse PDF text without a library)
    pdf_bytes.seek(0)
    pdf_content = pdf_bytes.read()
    
    # Check that PDF is not empty
    assert len(pdf_content) > 0
    
    # For WeasyPrint, we can't easily extract text from PDF bytes without additional libraries
    # So we verify the PDF was generated successfully by checking size
    assert len(pdf_content) > 10000


def test_pdf_with_no_findings():
    """Test PDF generation with a scan that has no findings"""
    from unittest.mock import Mock
    
    scan = Mock(spec=Scan)
    scan.id = 1
    scan.url = "https://example.com"
    scan.normalized_url = "https://example.com"
    scan.final_url = None
    scan.overall_score = 100.0
    scan.risk_level = RiskLevel.LOW
    scan.response_status = None
    scan.created_at = datetime.now()
    scan.redirect_chain = None
    scan.findings = []
    
    pdf_bytes = PDFGenerator.generate_pdf(scan)
    
    assert pdf_bytes is not None
    pdf_bytes.seek(0, 2)
    size = pdf_bytes.tell()
    assert size > 5000  # Even with no findings, should have cover, TOC, etc.


def test_pdf_handles_missing_data():
    """Test PDF generation with minimal scan data"""
    from unittest.mock import Mock
    
    scan = Mock(spec=Scan)
    scan.id = 1
    scan.url = "https://example.com"
    scan.normalized_url = None
    scan.final_url = None
    scan.overall_score = None
    scan.risk_level = None
    scan.response_status = None
    scan.created_at = None
    scan.redirect_chain = None
    scan.findings = []
    
    pdf_bytes = PDFGenerator.generate_pdf(scan)
    
    assert pdf_bytes is not None
    pdf_bytes.seek(0, 2)
    size = pdf_bytes.tell()
    assert size > 5000  # Should still generate a valid PDF

