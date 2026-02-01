"""
Monitoring service for scheduled scans and alert generation.

This service handles:
- Running scheduled scans based on MonitoringConfig
- Comparing scans to detect issues
- Creating alerts when problems are detected
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import Optional

from app.models.monitoring_config import MonitoringConfig, MonitoringFrequency
from app.models.alert import Alert, AlertType
from app.models.scan import Scan
from app.models.finding import Finding, FindingSeverity
from app.services.scanner import ScannerService
from app.services.email_service import send_alert_email


class MonitoringService:
    """Service for handling scheduled monitoring and alerts"""
    
    SCORE_DROP_THRESHOLD = 10  # Alert if score drops by 10+ points
    
    def should_run_scan(self, config: MonitoringConfig) -> bool:
        """Check if a scan should run based on frequency and last_run_at"""
        if not config.enabled:
            return False
        
        if not config.last_run_at:
            return True  # Never run before
        
        from datetime import timezone
        now = datetime.now(timezone.utc)
        # Ensure last_run_at is timezone-aware
        if config.last_run_at.tzinfo is None:
            # If naive, assume UTC
            last_run = config.last_run_at.replace(tzinfo=timezone.utc)
        else:
            last_run = config.last_run_at
        time_since_last_run = now - last_run
        
        # Only weekly and monthly supported in v1
        if config.frequency == MonitoringFrequency.WEEKLY:
            return time_since_last_run >= timedelta(days=7)
        elif config.frequency == MonitoringFrequency.MONTHLY:
            return time_since_last_run >= timedelta(days=30)
        
        return False
    
    async def run_scheduled_scan(self, config: MonitoringConfig, db: Session) -> Optional[Scan]:
        """Run a scheduled scan for a monitoring config"""
        if not self.should_run_scan(config):
            return None
        
        # Get site URL
        site = config.site
        url = f"https://{site.domain}"
        
        # Create and run scan (similar to scan endpoint)
        from app.models.scan import Scan, RiskLevel
        from app.models.finding import Finding
        import json
        
        scan = Scan(url=url, user_id=None, site_id=site.id)
        db.add(scan)
        db.flush()
        
        # Run scan
        scanner = ScannerService()
        scan_result = await scanner.scan_url(url)
        
        # Update scan with metadata
        scan.normalized_url = scan_result.normalized_url
        scan.final_url = scan_result.final_url
        scan.redirect_chain = json.dumps(scan_result.redirect_chain) if scan_result.redirect_chain else None
        scan.response_status = scan_result.response_status
        scan.overall_score = scan_result.overall_score
        scan.risk_level = RiskLevel(scan_result.risk_level) if scan_result.risk_level else None
        
        # Create findings
        for finding_data in scan_result.findings:
            finding = Finding(
                scan_id=scan.id,
                category=finding_data["category"],
                severity=finding_data["severity"],
                title=finding_data["title"],
                description=finding_data["description"],
                recommendation=finding_data.get("recommendation")
            )
            db.add(finding)
        
        # Update monitoring config
        from datetime import timezone
        config.last_run_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(scan)
        
        return scan
    
    def detect_alerts(self, new_scan: Scan, db: Session) -> list[Alert]:
        """Compare new scan with previous scan and create alerts if needed"""
        alerts = []
        
        if not new_scan.site_id:
            return alerts
        
        # Get previous scan for this site
        previous_scan = db.query(Scan).filter(
            Scan.site_id == new_scan.site_id,
            Scan.id != new_scan.id
        ).order_by(desc(Scan.created_at)).first()
        
        if not previous_scan:
            return alerts  # No previous scan to compare
        
        # Check for score drop
        if new_scan.overall_score is not None and previous_scan.overall_score is not None:
            score_drop = previous_scan.overall_score - new_scan.overall_score
            if score_drop >= self.SCORE_DROP_THRESHOLD:
                alert = Alert(
                    site_id=new_scan.site_id,
                    scan_id=new_scan.id,
                    alert_type=AlertType.SCORE_DROP,
                    message=f"Security score dropped by {score_drop:.1f} points (from {previous_scan.overall_score:.1f} to {new_scan.overall_score:.1f})"
                )
                alerts.append(alert)
        
        # Check for new critical/high findings
        previous_critical_high = set()
        for finding in previous_scan.findings:
            if finding.severity in [FindingSeverity.CRITICAL, FindingSeverity.HIGH]:
                previous_critical_high.add(finding.title)
        
        new_critical_high = []
        for finding in new_scan.findings:
            if finding.severity in [FindingSeverity.CRITICAL, FindingSeverity.HIGH]:
                if finding.title not in previous_critical_high:
                    new_critical_high.append(finding)
        
        # Create alerts for new critical/high issues
        for finding in new_critical_high:
            alert_type = AlertType.NEW_CRITICAL if finding.severity == FindingSeverity.CRITICAL else AlertType.NEW_HIGH
            alert = Alert(
                site_id=new_scan.site_id,
                scan_id=new_scan.id,
                alert_type=alert_type,
                message=f"New {finding.severity.value} issue detected: {finding.title}"
            )
            alerts.append(alert)
        
        # Save alerts to database
        for alert in alerts:
            db.add(alert)
            # Send email notification (placeholder for now)
            send_alert_email(alert, new_scan.site)
        
        if alerts:
            db.commit()
        
        return alerts
    
    async def process_all_monitoring_configs(self, db: Session) -> list[Scan]:
        """Process all enabled monitoring configs and run scans as needed"""
        configs = db.query(MonitoringConfig).filter(
            MonitoringConfig.enabled == True
        ).all()
        
        scans_run = []
        for config in configs:
            try:
                scan = await self.run_scheduled_scan(config, db)
                if scan:
                    scans_run.append(scan)
                    # Detect alerts after scan completes
                    self.detect_alerts(scan, db)
            except Exception as e:
                print(f"Error processing monitoring config {config.id}: {e}")
                # Continue with other configs even if one fails
                continue
        
        return scans_run

