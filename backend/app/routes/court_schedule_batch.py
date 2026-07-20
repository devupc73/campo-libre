from datetime import time

from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.court_schedule import CourtSchedule

router = APIRouter(prefix='/court-schedules-batch', tags=['court-schedules-batch'])


def parse_time(value):
    if isinstance(value, time):
        return value
    if isinstance(value, str):
        return time.fromisoformat(value)
    return value


@router.post('')
def upsert_many(payload: dict):
    db: Session = SessionLocal()
    items = payload.get('items', [])
    saved = []

    try:
        for item in items:
            schedule_id = item.get('id')
            start_time = parse_time(item.get('start_time'))
            end_time = parse_time(item.get('end_time'))
            schedule = None

            if schedule_id:
                schedule = db.query(CourtSchedule).filter(CourtSchedule.id == schedule_id).first()

            if not schedule:
                schedule = db.query(CourtSchedule).filter(
                    CourtSchedule.court_id == item.get('court_id'),
                    CourtSchedule.day_of_week == item.get('day_of_week'),
                    CourtSchedule.start_time == start_time,
                    CourtSchedule.end_time == end_time,
                ).first()

            if schedule:
                schedule.price_per_hour = item.get('price_per_hour', schedule.price_per_hour)
                schedule.status = item.get('status', schedule.status)
                schedule.is_reserved = item.get('is_reserved', schedule.is_reserved)
            else:
                schedule = CourtSchedule(
                    court_id=item.get('court_id'),
                    day_of_week=item.get('day_of_week'),
                    start_time=start_time,
                    end_time=end_time,
                    price_per_hour=item.get('price_per_hour', 0),
                    status=item.get('status', 'active'),
                    is_reserved=item.get('is_reserved', False),
                )
                db.add(schedule)

            saved.append(schedule)

        db.commit()
        for schedule in saved:
            db.refresh(schedule)
        return {'updated': len(saved), 'items': saved}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@router.post('/range')
def update_range(payload: dict):
    db: Session = SessionLocal()
    try:
        court_id = int(payload.get('court_id'))
        day_from = int(payload.get('day_from'))
        day_to = int(payload.get('day_to'))
        start_time = parse_time(payload.get('start_time'))
        end_time = parse_time(payload.get('end_time'))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail='Rango de días u horas inválido')

    if day_from < 1 or day_to > 7 or day_from > day_to:
        raise HTTPException(status_code=400, detail='El rango de días debe estar entre 1 y 7')
    if not start_time or not end_time or start_time >= end_time:
        raise HTTPException(status_code=400, detail='El rango horario es inválido')

    query = db.query(CourtSchedule).filter(
        CourtSchedule.court_id == court_id,
        CourtSchedule.day_of_week >= day_from,
        CourtSchedule.day_of_week <= day_to,
        CourtSchedule.start_time >= start_time,
        CourtSchedule.end_time <= end_time,
    )
    schedules = query.all()
    if not schedules:
        raise HTTPException(status_code=404, detail='No se encontraron franjas dentro del rango indicado')

    price = payload.get('price_per_hour')
    status = payload.get('status')
    is_reserved = payload.get('is_reserved')

    for schedule in schedules:
        if price is not None:
            schedule.price_per_hour = float(price)
        if status in ['active', 'inactive']:
            schedule.status = status
        if isinstance(is_reserved, bool):
            schedule.is_reserved = is_reserved

    db.commit()
    for schedule in schedules:
        db.refresh(schedule)
    return {'updated': len(schedules), 'items': schedules}
