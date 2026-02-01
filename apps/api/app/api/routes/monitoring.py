from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List

from app.db.database import get_db
from app.models.monitoring_config import MonitoringConfig
from app.models.alert import Alert
from app.models.site import Site
from app.schemas.monitoring import MonitoringConfigCreate, MonitoringConfigUpdate, MonitoringConfigResponse
from app.schemas.alert import AlertResponse, AlertGroupedResponse
from app.services.scheduler import schedule_monitoring_task

router = APIRouter()


@router.post("/sites/{site_id}/monitoring", response_model=MonitoringConfigResponse, status_code=201)
async def create_monitoring_config(
    site_id: int,
    config_data: MonitoringConfigCreate,
    db: Session = Depends(get_db)
):
    """Create or update monitoring config for a site"""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    # Check if config already exists
    existing_config = db.query(MonitoringConfig).filter(
        MonitoringConfig.site_id == site_id
    ).first()
    
    if existing_config:
        # Update existing config
        if config_data.frequency is not None:
            existing_config.frequency = config_data.frequency
        if config_data.enabled is not None:
            existing_config.enabled = config_data.enabled
        db.commit()
        db.refresh(existing_config)
        return existing_config
    else:
        # Create new config
        config = MonitoringConfig(
            site_id=site_id,
            frequency=config_data.frequency,
            enabled=config_data.enabled
        )
        db.add(config)
        db.commit()
        db.refresh(config)
        return config


@router.get("/sites/{site_id}/monitoring", response_model=MonitoringConfigResponse)
async def get_monitoring_config(
    site_id: int,
    db: Session = Depends(get_db)
):
    """Get monitoring config for a site"""
    config = db.query(MonitoringConfig).filter(
        MonitoringConfig.site_id == site_id
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="Monitoring config not found. Create one first."
        )
    
    return config


@router.patch("/sites/{site_id}/monitoring", response_model=MonitoringConfigResponse)
async def update_monitoring_config(
    site_id: int,
    config_data: MonitoringConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update monitoring config for a site"""
    config = db.query(MonitoringConfig).filter(
        MonitoringConfig.site_id == site_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Monitoring config not found")
    
    if config_data.frequency is not None:
        config.frequency = config_data.frequency
    if config_data.enabled is not None:
        config.enabled = config_data.enabled
    
    db.commit()
    db.refresh(config)
    return config


@router.get("/alerts", response_model=List[AlertGroupedResponse])
async def get_alerts(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent alerts grouped by site"""
    alerts = db.query(Alert).order_by(
        desc(Alert.created_at)
    ).limit(limit).all()
    
    # Group by site
    grouped: dict[int, AlertGroupedResponse] = {}
    
    for alert in alerts:
        if alert.site_id not in grouped:
            site = alert.site
            grouped[alert.site_id] = AlertGroupedResponse(
                site_id=alert.site_id,
                site_domain=site.domain,
                site_display_name=site.display_name,
                alerts=[]
            )
        
        alert_response = AlertResponse(
            id=alert.id,
            site_id=alert.site_id,
            scan_id=alert.scan_id,
            alert_type=alert.alert_type,
            message=alert.message,
            created_at=alert.created_at,
            site_domain=alert.site.domain,
            site_display_name=alert.site.display_name
        )
        grouped[alert.site_id].alerts.append(alert_response)
    
    return list(grouped.values())


@router.post("/monitoring/run")
async def trigger_monitoring(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually trigger monitoring task (for testing or cron jobs)"""
    schedule_monitoring_task(background_tasks)
    return {"message": "Monitoring task scheduled"}

