import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base, engine
from app.models.brand_profile import BrandProfile
from sqlalchemy.orm import Session

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_create_brand_profile():
    """Test creating a brand profile"""
    response = client.post(
        "/brands",
        json={
            "name": "Test Brand",
            "primary_color": "#1E40AF",
            "accent_color": "#22C55E",
            "footer_text": "Custom footer text"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Brand"
    assert data["primary_color"] == "#1E40AF"
    assert data["accent_color"] == "#22C55E"
    assert data["footer_text"] == "Custom footer text"
    assert "id" in data


def test_create_brand_profile_invalid_color():
    """Test creating a brand profile with invalid color"""
    response = client.post(
        "/brands",
        json={
            "name": "Test Brand",
            "primary_color": "invalid-color",
            "accent_color": "#22C55E"
        }
    )
    assert response.status_code == 422


def test_list_brand_profiles():
    """Test listing brand profiles"""
    # Create a brand first
    client.post(
        "/brands",
        json={
            "name": "Test Brand",
            "primary_color": "#1E40AF",
            "accent_color": "#22C55E"
        }
    )
    
    response = client.get("/brands")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Brand"


def test_get_brand_profile():
    """Test getting a brand profile by ID"""
    # Create a brand first
    create_response = client.post(
        "/brands",
        json={
            "name": "Test Brand",
            "primary_color": "#1E40AF",
            "accent_color": "#22C55E"
        }
    )
    brand_id = create_response.json()["id"]
    
    response = client.get(f"/brands/{brand_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == brand_id
    assert data["name"] == "Test Brand"


def test_get_brand_profile_not_found():
    """Test getting a non-existent brand profile"""
    response = client.get("/brands/999")
    assert response.status_code == 404

