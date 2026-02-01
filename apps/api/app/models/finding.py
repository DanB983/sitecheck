from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base


class FindingCategory(str, enum.Enum):
    SECURITY = "security"
    GDPR = "gdpr"
    SEO = "seo"
    OTHER = "other"


class FindingSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False, index=True)
    category = Column(SQLEnum(FindingCategory), nullable=False)
    severity = Column(SQLEnum(FindingSeverity), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    recommendation = Column(String, nullable=True)
    
    scan = relationship("Scan", back_populates="findings")

