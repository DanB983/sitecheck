from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import health, scan, stripe, brands, shared, sites, monitoring, internal
from app.db.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"⚠️  Database connection failed (Docker may not be running): {e}")
        print("   Backend will start but database operations will fail.")
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Elephantfly Scan API",
    description="Security & GDPR compliance scanning API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(scan.router, prefix="/scan", tags=["scan"])
app.include_router(stripe.router, prefix="/stripe", tags=["stripe"])
app.include_router(brands.router, prefix="/brands", tags=["brands"])
app.include_router(shared.router, prefix="/shared", tags=["shared"])
app.include_router(sites.router, prefix="/sites", tags=["sites"])
app.include_router(monitoring.router, prefix="", tags=["monitoring"])
app.include_router(internal.router, prefix="", tags=["internal"])


@app.get("/")
async def root():
    return {"message": "Elephantfly Scan API", "version": "1.0.0"}

