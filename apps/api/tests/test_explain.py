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
def test_explain_scan_deterministic(test_db):
    """Test that explain endpoint returns deterministic output from StubLLMClient"""
    # Create a scan with known findings
    respx.get("https://example.com").mock(return_value=httpx.Response(
        200,
        text="<html></html>",
        headers={}
    ))
    respx.get("https://example.com/robots.txt").mock(return_value=httpx.Response(404))
    
    # Create scan
    create_response = client.post("/scan", json={"url": "https://example.com"})
    scan_id = create_response.json()["scan_id"]
    
    # Get explanation
    explain_response = client.get(f"/scan/{scan_id}/explain")
    assert explain_response.status_code == 200
    
    data = explain_response.json()
    
    # Verify structure
    assert "executive_summary" in data
    assert "top_risks" in data
    assert "quick_wins" in data
    assert "recommended_next_step" in data
    
    # Verify types
    assert isinstance(data["executive_summary"], str)
    assert isinstance(data["top_risks"], list)
    assert len(data["top_risks"]) == 3
    assert isinstance(data["quick_wins"], list)
    assert len(data["quick_wins"]) == 3
    assert isinstance(data["recommended_next_step"], str)
    
    # Verify content includes disclaimer
    assert "not a penetration test" in data["executive_summary"].lower() or "not a pentest" in data["executive_summary"].lower()
    
    # Verify deterministic: same scan should return same explanation
    explain_response2 = client.get(f"/scan/{scan_id}/explain")
    assert explain_response2.status_code == 200
    data2 = explain_response2.json()
    assert data == data2


@respx.mock
def test_explain_scan_not_found(test_db):
    """Test explain endpoint with non-existent scan"""
    response = client.get("/scan/99999/explain")
    assert response.status_code == 404


@respx.mock
def test_explain_scan_with_critical_findings(test_db):
    """Test explanation reflects critical findings"""
    # Create scan with HTTP (which generates critical finding)
    respx.get("http://example.com").mock(return_value=httpx.Response(200, text="<html></html>"))
    respx.get("http://example.com/robots.txt").mock(return_value=httpx.Response(404))
    
    create_response = client.post("/scan", json={"url": "http://example.com"})
    scan_id = create_response.json()["scan_id"]
    
    explain_response = client.get(f"/scan/{scan_id}/explain")
    assert explain_response.status_code == 200
    
    data = explain_response.json()
    
    # Should mention critical issues in recommended_next_step
    assert "critical" in data["recommended_next_step"].lower() or "immediate" in data["recommended_next_step"].lower()
    
    # Top risks should include critical items
    top_risks_text = " ".join(data["top_risks"]).lower()
    assert "critical" in top_risks_text or "high" in top_risks_text

