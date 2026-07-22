from datetime import date

from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.court_schedule import CourtSchedule
from app.schemas.court_schedule import CourtScheduleCreate

router = APIRouter(prefix='/court-schedules', tags=['court-schedules'])


@router.get('')
def list_schedules(court_id: int | None = None, date_from: date | None = None, date_to: date | None = None):
    db: Session = SessionLocal()
    query = db.query(CourtSchedule)
    if court_id:
        query = query.filter(CourtSchedule.court_id == court_id)
    if date_from:
        query = query.filter(CourtSchedule.calendar_date >= date_from)
    if date_to:
        query = query.filter(CourtSchedule.calendar_date <= date_to)
    return query.order_by(CourtSchedule.calendar_date, CourtSchedule.day_of_week, CourtSchedule.start_time).all()


@router.post('')
def create_schedule(payload: CourtScheduleCreate):
    db: Session = SessionLocal()
    calendar_date = payload.calendar_date
    day_of_week = calendar_date.isoweekday() if calendar_date else payload.day_of_week
    existing = db.query(CourtSchedule).filter(
        CourtSchedule.court_id == payload.court_id,
        CourtSchedule.calendar_date == calendar_date,
        CourtSchedule.day_of_week == day_of_week,
        CourtSchedule.start_time == payload.start_time,
        CourtSchedule.end_time == payload.end_time,
    ).first()

    if existing:
        existing.price_per_hour = payload.price_per_hour
        existing.status = payload.status
        existing.is_reserved = payload.is_reserved
        db.commit()
        db.refresh(existing)
        return existing

    schedule = CourtSchedule(
        court_id=payload.court_id,
        calendar_date=calendar_date,
        day_of_week=day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        price_per_hour=payload.price_per_hour,
        status=payload.status,
        is_reserved=payload.is_reserved,
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
    schedule.calendar_date = payload.calendar_date
    schedule.day_of_week = payload.calendar_date.isoweekday() if payload.calendar_date else payload.day_of_week
    schedule.start_time = payload.start_time
    schedule.end_time = payload.end_time
    schedule.price_per_hour = payload.price_per_hour
    schedule.status = payload.status
    schedule.is_reserved = payload.is_reserved
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
