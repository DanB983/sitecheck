from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum, JSON, Text
from sqlalchemy.dialects.postgresql import JSON as PostgresJSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class RiskLevel(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True, index=True)
    url = Column(String, nullable=False, index=True)
    normalized_url = Column(String, nullable=True)
    final_url = Column(String, nullable=True)
    redirect_chain = Column(Text, nullable=True)  # List of URLs (stored as JSON string for SQLite compatibility)
    response_status = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    overall_score = Column(Float, nullable=True)
    risk_level = Column(SQLEnum(RiskLevel), nullable=True)
    
    user = relationship("User", back_populates="scans")
    site = relationship("Site", back_populates="scans")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    shared_links = relationship("SharedReportLink", back_populates="scan", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="scan", cascade="all, delete-orphan")

