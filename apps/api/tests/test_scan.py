import pytest
import respx
import httpx
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app
from app.db.database import Base, get_db

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@respx.mock
def test_create_scan(test_db):
    """Test creating a scan with real HTTP checks"""
    # Mock HTTP responses
    respx.get("https://example.com").mock(return_value=httpx.Response(
        200,
        text="<html></html>",
        headers={
            "Strict-Transport-Security": "max-age=31536000",
            "Content-Security-Policy": "default-src 'self'"
        }
    ))
    respx.get("https://example.com/robots.txt").mock(return_value=httpx.Response(200, text="User-agent: *\nAllow: /"))
    
    response = client.post("/scan", json={"url": "https://example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "scan_id" in data
    assert data["url"] == "https://example.com"
    assert "findings_count" in data
    assert "findings_by_severity" in data
    assert "overall_score" in data
    assert "risk_level" in data


@respx.mock
def test_create_scan_url_normalization(test_db):
    """Test URL normalization in scan creation"""
    respx.get("https://example.com").mock(return_value=httpx.Response(
        200, 
        text="<html></html>",
        headers={
            "Strict-Transport-Security": "max-age=31536000",
            "Content-Security-Policy": "default-src 'self'"
        }
    ))
    respx.get("https://example.com/robots.txt").mock(return_value=httpx.Response(404))
    
    # Test without scheme - validator normalizes it
    response = client.post("/scan", json={"url": "example.com"})
    assert response.status_code == 200
    data = response.json()
    # The validator normalizes the URL, so it will have https://
    assert "example.com" in data["url"]
    
    # Retrieve scan to check normalized URL
    scan_id = data["scan_id"]
    get_response = client.get(f"/scan/{scan_id}")
    assert get_response.status_code == 200
    scan_data = get_response.json()
    # Normalized URL should have https:// added
    assert scan_data["normalized_url"] is not None
    assert "example.com" in scan_data["normalized_url"]


@respx.mock
def test_get_scan_with_metadata(test_db):
    """Test retrieving a scan with full metadata"""
    # Mock responses
    respx.get("https://example.com").mock(return_value=httpx.Response(
        200,
        text="<html></html>",
        headers={"Server": "nginx/1.18.0"}
    ))
    respx.get("https://example.com/robots.txt").mock(return_value=httpx.Response(404))
    
    # Create a scan
    create_response = client.post("/scan", json={"url": "https://example.com"})
    scan_id = create_response.json()["scan_id"]
    
    # Retrieve it
    response = client.get(f"/scan/{scan_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == scan_id
    assert data["url"] == "https://example.com"
    assert "normalized_url" in data
    assert "final_url" in data
    assert "redirect_chain" in data
    assert "response_status" in data
    assert "findings" in data
    assert len(data["findings"]) > 0


def test_get_nonexistent_scan(test_db):
    """Test retrieving a non-existent scan"""
    response = client.get("/scan/99999")
    assert response.status_code == 404

