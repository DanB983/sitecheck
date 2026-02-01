from fastapi import APIRouter

router = APIRouter()


@router.get("/config")
async def get_stripe_config():
    """Get Stripe publishable key (placeholder)"""
    from app.core.config import settings
    return {
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        "status": "placeholder"
    }


@router.post("/create-checkout-session")
async def create_checkout_session():
    """Create Stripe checkout session (placeholder)"""
    return {
        "session_id": "placeholder",
        "message": "Stripe integration not yet implemented"
    }

