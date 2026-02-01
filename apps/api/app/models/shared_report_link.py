from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class SharedReportLink(Base):
    __tablename__ = "shared_report_links"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False, index=True)
    token = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True, default=uuid.uuid4)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    scan = relationship("Scan", back_populates="shared_links")

