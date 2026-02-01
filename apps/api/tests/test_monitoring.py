"""
Tests for monitoring and alerts functionality.
"""
import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.models.site import Site
from app.models.scan import Scan, RiskLevel
from app.models.finding import Finding, FindingSeverity
from app.models.monitoring_config import MonitoringConfig, MonitoringFrequency
from app.models.alert import Alert, AlertType
from app.services.monitoring_service import MonitoringService
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base

# Use same test database setup as test_scan
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """Create test database tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(test_db):
    """Get a database session"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_site(db: Session) -> Site:
    """Create a test site"""
    site = Site(domain="example.com", display_name="Example Site")
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@pytest.fixture
def monitoring_config(db: Session, test_site: Site) -> MonitoringConfig:
    """Create a test monitoring config"""
    config = MonitoringConfig(
        site_id=test_site.id,
        frequency=MonitoringFrequency.WEEKLY,
        enabled=True
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def test_monitoring_config_crud(db: Session, test_site: Site):
    """Test creating, reading, and updating monitoring config"""
    # Create
    config = MonitoringConfig(
        site_id=test_site.id,
        frequency=MonitoringFrequency.WEEKLY,
        enabled=False
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    
    assert config.id is not None
    assert config.site_id == test_site.id
    assert config.frequency == MonitoringFrequency.WEEKLY
    assert config.enabled is False  # Default should be False
    
    # Read
    found = db.query(MonitoringConfig).filter(MonitoringConfig.site_id == test_site.id).first()
    assert found is not None
    assert found.id == config.id
    
    # Update
    found.enabled = True
    found.frequency = MonitoringFrequency.MONTHLY
    db.commit()
    db.refresh(found)
    
    assert found.enabled is True
    assert found.frequency == MonitoringFrequency.MONTHLY


def test_should_run_scan_never_run(monitoring_config: MonitoringConfig):
    """Test that scan should run if never run before"""
    service = MonitoringService()
    assert service.should_run_scan(monitoring_config) is True


def test_should_run_scan_disabled(monitoring_config: MonitoringConfig):
    """Test that scan should not run if disabled"""
    monitoring_config.enabled = False
    service = MonitoringService()
    assert service.should_run_scan(monitoring_config) is False


def test_should_run_scan_weekly_not_due(monitoring_config: MonitoringConfig):
    """Test that scan should not run if weekly and only 1 day passed"""
    monitoring_config.last_run_at = datetime.now(timezone.utc) - timedelta(days=1)
    service = MonitoringService()
    assert service.should_run_scan(monitoring_config) is False


def test_should_run_scan_weekly_due(monitoring_config: MonitoringConfig):
    """Test that scan should run if weekly and 7+ days passed"""
    monitoring_config.last_run_at = datetime.now(timezone.utc) - timedelta(days=8)
    service = MonitoringService()
    assert service.should_run_scan(monitoring_config) is True


def test_should_run_scan_monthly_not_due(monitoring_config: MonitoringConfig):
    """Test that scan should not run if monthly and only 7 days passed"""
    monitoring_config.frequency = MonitoringFrequency.MONTHLY
    monitoring_config.last_run_at = datetime.now(timezone.utc) - timedelta(days=7)
    service = MonitoringService()
    assert service.should_run_scan(monitoring_config) is False


def test_should_run_scan_monthly_due(monitoring_config: MonitoringConfig):
    """Test that scan should run if monthly and 30+ days passed"""
    monitoring_config.frequency = MonitoringFrequency.MONTHLY
    monitoring_config.last_run_at = datetime.now(timezone.utc) - timedelta(days=31)
    service = MonitoringService()
    assert service.should_run_scan(monitoring_config) is True


def test_detect_score_drop_alert(db: Session, test_site: Site):
    """Test that score drop alert is created when score drops by >= 10"""
    # Create previous scan with high score
    previous_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=85.0,
        risk_level=RiskLevel.LOW
    )
    db.add(previous_scan)
    db.commit()
    
    # Create new scan with lower score
    new_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=70.0,  # Dropped by 15 points
        risk_level=RiskLevel.MEDIUM
    )
    db.add(new_scan)
    db.commit()
    
    # Detect alerts
    service = MonitoringService()
    alerts = service.detect_alerts(new_scan, db)
    
    assert len(alerts) == 1
    assert alerts[0].alert_type == AlertType.SCORE_DROP
    assert "dropped by" in alerts[0].message.lower()
    assert "15.0" in alerts[0].message or "15" in alerts[0].message


def test_detect_score_drop_no_alert_small_drop(db: Session, test_site: Site):
    """Test that no alert is created for small score drops"""
    # Create previous scan
    previous_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=85.0,
        risk_level=RiskLevel.LOW
    )
    db.add(previous_scan)
    db.commit()
    
    # Create new scan with small drop
    new_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=82.0,  # Dropped by only 3 points
        risk_level=RiskLevel.LOW
    )
    db.add(new_scan)
    db.commit()
    
    # Detect alerts
    service = MonitoringService()
    alerts = service.detect_alerts(new_scan, db)
    
    assert len(alerts) == 0


def test_detect_new_critical_alert(db: Session, test_site: Site):
    """Test that alert is created when new critical finding appears"""
    # Create previous scan with no critical findings
    previous_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=85.0,
        risk_level=RiskLevel.LOW
    )
    db.add(previous_scan)
    db.commit()
    
    # Add a low severity finding to previous scan
    finding1 = Finding(
        scan_id=previous_scan.id,
        category="security",
        severity=FindingSeverity.LOW,
        title="Minor issue",
        description="A minor issue"
    )
    db.add(finding1)
    db.commit()
    
    # Create new scan with critical finding
    new_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=75.0,
        risk_level=RiskLevel.CRITICAL
    )
    db.add(new_scan)
    db.commit()
    
    # Add critical finding
    critical_finding = Finding(
        scan_id=new_scan.id,
        category="security",
        severity=FindingSeverity.CRITICAL,
        title="Critical security issue",
        description="A critical issue"
    )
    db.add(critical_finding)
    db.commit()
    
    # Detect alerts
    service = MonitoringService()
    alerts = service.detect_alerts(new_scan, db)
    
    assert len(alerts) >= 1
    critical_alerts = [a for a in alerts if a.alert_type == AlertType.NEW_CRITICAL]
    assert len(critical_alerts) == 1
    assert "critical" in critical_alerts[0].message.lower()


def test_detect_new_high_alert(db: Session, test_site: Site):
    """Test that alert is created when new high severity finding appears"""
    # Create previous scan
    previous_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=85.0,
        risk_level=RiskLevel.LOW
    )
    db.add(previous_scan)
    db.commit()
    
    # Create new scan with high finding
    new_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=75.0,
        risk_level=RiskLevel.HIGH
    )
    db.add(new_scan)
    db.commit()
    
    # Add high finding
    high_finding = Finding(
        scan_id=new_scan.id,
        category="security",
        severity=FindingSeverity.HIGH,
        title="High severity issue",
        description="A high severity issue"
    )
    db.add(high_finding)
    db.commit()
    
    # Detect alerts
    service = MonitoringService()
    alerts = service.detect_alerts(new_scan, db)
    
    assert len(alerts) >= 1
    high_alerts = [a for a in alerts if a.alert_type == AlertType.NEW_HIGH]
    assert len(high_alerts) == 1
    assert "high" in high_alerts[0].message.lower()


def test_detect_no_alert_same_findings(db: Session, test_site: Site):
    """Test that no alert is created if same findings exist in both scans"""
    # Create previous scan with critical finding
    previous_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=85.0,
        risk_level=RiskLevel.CRITICAL
    )
    db.add(previous_scan)
    db.commit()
    
    finding1 = Finding(
        scan_id=previous_scan.id,
        category="security",
        severity=FindingSeverity.CRITICAL,
        title="Critical security issue",
        description="A critical issue"
    )
    db.add(finding1)
    db.commit()
    
    # Create new scan with same critical finding
    new_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=85.0,
        risk_level=RiskLevel.CRITICAL
    )
    db.add(new_scan)
    db.commit()
    
    finding2 = Finding(
        scan_id=new_scan.id,
        category="security",
        severity=FindingSeverity.CRITICAL,
        title="Critical security issue",  # Same title
        description="A critical issue"
    )
    db.add(finding2)
    db.commit()
    
    # Detect alerts
    service = MonitoringService()
    alerts = service.detect_alerts(new_scan, db)
    
    # Should not create new_critical alert since it's the same finding
    critical_alerts = [a for a in alerts if a.alert_type == AlertType.NEW_CRITICAL]
    assert len(critical_alerts) == 0


def test_detect_alerts_no_previous_scan(db: Session, test_site: Site):
    """Test that no alerts are created if there's no previous scan"""
    # Create first scan
    new_scan = Scan(
        url="https://example.com",
        site_id=test_site.id,
        overall_score=75.0,
        risk_level=RiskLevel.CRITICAL
    )
    db.add(new_scan)
    db.commit()
    
    # Detect alerts
    service = MonitoringService()
    alerts = service.detect_alerts(new_scan, db)
    
    # Should not create alerts without previous scan to compare
    assert len(alerts) == 0

