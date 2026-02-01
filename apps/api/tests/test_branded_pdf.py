import pytest
import os
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base, engine, get_db
from app.models.scan import Scan
from app.models.brand_profile import BrandProfile
from app.models.finding import Finding, FindingCategory, FindingSeverity
from sqlalchemy.orm import Session

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_scan(db: Session = next(get_db())):
    """Create a sample scan for testing"""
    scan = Scan(
        url="https://example.com",
        normalized_url="https://example.com",
        final_url="https://example.com",
        overall_score=85.0,
        response_status=200
    )
    db.add(scan)
    db.flush()
    
    finding = Finding(
        scan_id=scan.id,
        category=FindingCategory.SECURITY,
        severity=FindingSeverity.HIGH,
        title="Missing HSTS Header",
        description="The site does not include a Strict-Transport-Security header.",
        recommendation="Add HSTS header to improve security."
    )
    db.add(finding)
    db.commit()
    db.refresh(scan)
    return scan


@pytest.fixture
def sample_brand(db: Session = next(get_db())):
    """Create a sample brand profile for testing"""
    brand = BrandProfile(
        name="Test Agency",
        primary_color="#1E40AF",
        accent_color="#22C55E",
        footer_text="Custom footer"
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


def test_branded_pdf_premium_gate(sample_scan):
    """Test that branded PDF returns 402 when ENABLE_BRANDED_PDF is false"""
    # Ensure the setting is False
    os.environ["ENABLE_BRANDED_PDF"] = "false"
    from app.core.config import settings
    settings.enable_branded_pdf = False
    
    response = client.get(
        f"/scan/{sample_scan.id}/pdf",
        params={"mode": "branded", "brand_id": 1}
    )
    assert response.status_code == 402
    assert "premium feature" in response.json()["detail"].lower()


def test_branded_pdf_success(sample_scan, sample_brand):
    """Test that branded PDF works when enabled"""
    # Enable branded PDF
    os.environ["ENABLE_BRANDED_PDF"] = "true"
    from app.core.config import settings
    settings.enable_branded_pdf = True
    
    response = client.get(
        f"/scan/{sample_scan.id}/pdf",
        params={"mode": "branded", "brand_id": sample_brand.id}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    # Check that PDF contains brand name
    pdf_content = response.content
    assert b"Test Agency" in pdf_content or b"test agency" in pdf_content.lower()


def test_branded_pdf_brand_not_found(sample_scan):
    """Test that branded PDF returns 404 when brand doesn't exist"""
    os.environ["ENABLE_BRANDED_PDF"] = "true"
    from app.core.config import settings
    settings.enable_branded_pdf = True
    
    response = client.get(
        f"/scan/{sample_scan.id}/pdf",
        params={"mode": "branded", "brand_id": 999}
    )
    assert response.status_code == 404


def test_neutral_pdf_works(sample_scan):
    """Test that neutral PDF works without premium gate"""
    response = client.get(f"/scan/{sample_scan.id}/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

