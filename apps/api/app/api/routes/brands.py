from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.brand_profile import BrandProfile
from app.schemas.brand_profile import BrandProfileCreate, BrandProfileResponse

router = APIRouter()


# TODO: Add authentication/authorization middleware
# These endpoints should be locked down in production


@router.post("", response_model=BrandProfileResponse, status_code=201)
async def create_brand_profile(
    brand_data: BrandProfileCreate,
    db: Session = Depends(get_db)
):
    """Create a new brand profile"""
    # If this is set as default, unset other defaults
    is_default = getattr(brand_data, 'is_default', False)
    if is_default:
        db.query(BrandProfile).filter(BrandProfile.is_default == True).update({"is_default": False})
    
    brand = BrandProfile(
        name=brand_data.name,
        logo_base64=brand_data.logo_base64,
        primary_color=brand_data.primary_color,
        accent_color=brand_data.accent_color,
        footer_text=brand_data.footer_text,
        is_default=is_default
    )
    
    db.add(brand)
    db.commit()
    db.refresh(brand)
    
    return brand


@router.get("", response_model=List[BrandProfileResponse])
async def list_brand_profiles(db: Session = Depends(get_db)):
    """List all brand profiles"""
    brands = db.query(BrandProfile).order_by(BrandProfile.created_at.desc()).all()
    return brands


@router.get("/{brand_id}", response_model=BrandProfileResponse)
async def get_brand_profile(brand_id: int, db: Session = Depends(get_db)):
    """Get a brand profile by ID"""
    brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return brand

