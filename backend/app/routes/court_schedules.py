from fastapi import APIRouter
from fastapi import HTTPException
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

    existing = db.query(CourtSchedule).filter(
        CourtSchedule.court_id == payload.court_id,
        CourtSchedule.day_of_week == payload.day_of_week,
        CourtSchedule.start_time == payload.start_time,
        CourtSchedule.end_time == payload.end_time,
    ).first()

    if existing:
        existing.price_per_hour = payload.price_per_hour
        existing.status = payload.status
        db.commit()
        db.refresh(existing)
        return existing

    schedule = CourtSchedule(
        court_id=payload.court_id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        price_per_hour=payload.price_per_hour,
        status=payload.status,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


@router.put('/{schedule_id}')
def update_schedule(schedule_id: int, payload: CourtScheduleCreate):
    db: Session = SessionLocal()

    schedule = db.query(CourtSchedule).filter(CourtSchedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(status_code=404, detail='Court schedule not found')

    schedule.court_id = payload.court_id
    schedule.day_of_week = payload.day_of_week
    schedule.start_time = payload.start_time
    schedule.end_time = payload.end_time
    schedule.price_per_hour = payload.price_per_hour
    schedule.status = payload.status

    db.commit()
    db.refresh(schedule)

    return schedule


@router.delete('/{schedule_id}')
def delete_schedule(schedule_id: int):
    db: Session = SessionLocal()

    schedule = db.query(CourtSchedule).filter(CourtSchedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(status_code=404, detail='Court schedule not found')

    db.delete(schedule)
    db.commit()

    return {'message': 'Court schedule deleted'}
