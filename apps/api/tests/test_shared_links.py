import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from uuid import uuid4
from app.main import app
from app.db.database import Base, engine
from app.models.scan import Scan, RiskLevel
from app.models.finding import Finding, FindingCategory, FindingSeverity
from app.models.shared_report_link import SharedReportLink
from sqlalchemy.orm import Session

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_scan(db: Session = next(engine.connect().__enter__().begin().__enter__())):
    """Create a sample scan for testing"""
    from app.db.database import get_db
    db = next(get_db())
    
    scan = Scan(
        url="https://example.com",
        normalized_url="https://example.com",
        final_url="https://example.com",
        overall_score=85.0,
        risk_level=RiskLevel.LOW,
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
        recommendation="Add HSTS header."
    )
    db.add(finding)
    db.commit()
    db.refresh(scan)
    return scan


def test_create_share_link(sample_scan):
    """Test creating a share link"""
    response = client.post(
        f"/scan/{sample_scan.id}/share",
        json={"expires_in_hours": 24}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "share_url" in data
    assert "token" in data
    assert "expires_at" in data
    assert data["share_url"].startswith("http")
    assert "/shared/" in data["share_url"]


def test_create_share_link_no_expiry(sample_scan):
    """Test creating a share link without expiry"""
    response = client.post(
        f"/scan/{sample_scan.id}/share",
        json={}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["expires_at"] is None


def test_get_shared_report(sample_scan):
    """Test getting a shared report"""
    # Create share link
    share_response = client.post(
        f"/scan/{sample_scan.id}/share",
        json={}
    )
    token = share_response.json()["token"]
    
    # Get shared report
    response = client.get(f"/shared/{token}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_scan.id
    assert data["url"] == sample_scan.url
    assert "findings" in data


def test_get_shared_report_expired(sample_scan):
    """Test getting an expired shared report"""
    from app.db.database import get_db
    db = next(get_db())
    
    # Create expired link
    token = uuid4()
    shared_link = SharedReportLink(
        scan_id=sample_scan.id,
        token=token,
        expires_at=datetime.utcnow() - timedelta(hours=1)  # Expired 1 hour ago
    )
    db.add(shared_link)
    db.commit()
    
    # Try to get shared report
    response = client.get(f"/shared/{token}")
    
    assert response.status_code == 410
    assert "expired" in response.json()["detail"].lower()


def test_get_shared_report_not_found():
    """Test getting a non-existent shared report"""
    fake_token = uuid4()
    response = client.get(f"/shared/{fake_token}")
    
    assert response.status_code == 404


def test_create_share_link_invalid_scan_id():
    """Test creating a share link for non-existent scan"""
    response = client.post(
        "/scan/99999/share",
        json={}
    )
    
    assert response.status_code == 404


def test_create_share_link_invalid_expires_in_hours(sample_scan):
    """Test creating a share link with invalid expiry"""
    response = client.post(
        f"/scan/{sample_scan.id}/share",
        json={"expires_in_hours": -1}
    )
    
    assert response.status_code == 422  # Validation error

