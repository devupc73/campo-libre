from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.court_schedule import CourtSchedule
from app.schemas.court_schedule import CourtScheduleCreate

router = APIRouter(prefix='/court-schedules', tags=['court-schedules'])


@router.get('')
def list_schedules(court_id: int | None = None):
    db: Session = SessionLocal()

    query = db.query(CourtSchedule)

    if court_id:
        query = query.filter(CourtSchedule.court_id == court_id)

    return query.all()


@router.post('')
def create_schedule(payload: CourtScheduleCreate):
    db: Session = SessionLocal()

    schedule = CourtSchedule(
        court_id=payload.court_id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        price_per_hour=payload.price_per_hour,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule
