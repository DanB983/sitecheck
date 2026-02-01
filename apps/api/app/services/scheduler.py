"""
Background scheduler for running monitoring tasks.

This uses FastAPI BackgroundTasks for v1.
For production scale, consider migrating to:
- Celery with Redis/RabbitMQ
- RQ (Redis Queue)
- APScheduler
"""
import asyncio
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.services.monitoring_service import MonitoringService


async def run_monitoring_task():
    """Background task to run all scheduled monitoring scans"""
    db = SessionLocal()
    try:
        service = MonitoringService()
        scans_run = await service.process_all_monitoring_configs(db)
        print(f"Monitoring task completed: {len(scans_run)} scans run")
    except Exception as e:
        print(f"Error in monitoring task: {e}")
    finally:
        db.close()


def schedule_monitoring_task(background_tasks: BackgroundTasks):
    """
    Schedule monitoring task to run in background.
    
    This is called from API endpoints or can be triggered
    by a cron job calling the /monitoring/run endpoint.
    """
    background_tasks.add_task(run_monitoring_task)


# For production: Set up a proper scheduler
# Example with APScheduler:
# from apscheduler.schedulers.background import BackgroundScheduler
# 
# scheduler = BackgroundScheduler()
# scheduler.add_job(
#     run_monitoring_task,
#     'cron',
#     hour=0,  # Run daily at midnight
#     minute=0
# )
# scheduler.start()

