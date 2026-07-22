from datetime import date
from datetime import datetime
from datetime import time
from datetime import timedelta

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


def parse_date(value):
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        return date.fromisoformat(value)
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
            calendar_date = parse_date(item.get('calendar_date'))
            day_of_week = calendar_date.isoweekday() if calendar_date else int(item.get('day_of_week'))
            schedule = db.query(CourtSchedule).filter(CourtSchedule.id == schedule_id).first() if schedule_id else None
            if not schedule:
                schedule = db.query(CourtSchedule).filter(
                    CourtSchedule.court_id == item.get('court_id'),
                    CourtSchedule.calendar_date == calendar_date,
                    CourtSchedule.day_of_week == day_of_week,
                    CourtSchedule.start_time == start_time,
                    CourtSchedule.end_time == end_time,
                ).first()
            if schedule:
                schedule.calendar_date = calendar_date
                schedule.day_of_week = day_of_week
                schedule.price_per_hour = item.get('price_per_hour', schedule.price_per_hour)
                schedule.status = item.get('status', schedule.status)
                schedule.is_reserved = item.get('is_reserved', schedule.is_reserved)
            else:
                schedule = CourtSchedule(
                    court_id=item.get('court_id'), calendar_date=calendar_date, day_of_week=day_of_week,
                    start_time=start_time, end_time=end_time, price_per_hour=item.get('price_per_hour', 0),
                    status=item.get('status', 'active'), is_reserved=item.get('is_reserved', False),
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


@router.post('/generate-date-range')
def generate_date_range(payload: dict):
    db: Session = SessionLocal()
    try:
        court_id = int(payload.get('court_id'))
        date_from = parse_date(payload.get('date_from'))
        date_to = parse_date(payload.get('date_to'))
        start_time = parse_time(payload.get('start_time'))
        end_time = parse_time(payload.get('end_time'))
        price = float(payload.get('price_per_hour', 0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail='Rango de fechas, horas o tarifa inválido')
    if not date_from or not date_to or date_from > date_to:
        raise HTTPException(status_code=400, detail='El rango de fechas es inválido')
    if (date_to - date_from).days > 365:
        raise HTTPException(status_code=400, detail='El rango máximo permitido es de 366 días')
    if not start_time or not end_time or start_time >= end_time:
        raise HTTPException(status_code=400, detail='El rango horario es inválido')

    created = 0
    current_date = date_from
    while current_date <= date_to:
        slot_start = datetime.combine(current_date, start_time)
        range_end = datetime.combine(current_date, end_time)
        while slot_start < range_end:
            slot_end = slot_start + timedelta(hours=1)
            if slot_end > range_end:
                break
            existing = db.query(CourtSchedule).filter(
                CourtSchedule.court_id == court_id,
                CourtSchedule.calendar_date == current_date,
                CourtSchedule.start_time == slot_start.time(),
                CourtSchedule.end_time == slot_end.time(),
            ).first()
            if not existing:
                db.add(CourtSchedule(
                    court_id=court_id, calendar_date=current_date, day_of_week=current_date.isoweekday(),
                    start_time=slot_start.time(), end_time=slot_end.time(), price_per_hour=price,
                    status='active', is_reserved=False,
                ))
                created += 1
            slot_start = slot_end
        current_date += timedelta(days=1)
    db.commit()
    return {'created': created, 'date_from': date_from, 'date_to': date_to}


@router.post('/range')
def update_range(payload: dict):
    db: Session = SessionLocal()
    try:
        court_id = int(payload.get('court_id'))
        date_from = parse_date(payload.get('date_from'))
        date_to = parse_date(payload.get('date_to'))
        start_time = parse_time(payload.get('start_time'))
        end_time = parse_time(payload.get('end_time'))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail='Rango inválido')
    query = db.query(CourtSchedule).filter(
        CourtSchedule.court_id == court_id,
        CourtSchedule.calendar_date >= date_from,
        CourtSchedule.calendar_date <= date_to,
        CourtSchedule.start_time >= start_time,
        CourtSchedule.end_time <= end_time,
    )
    schedules = query.all()
    if not schedules:
        raise HTTPException(status_code=404, detail='No se encontraron franjas dentro del rango indicado')
    for schedule in schedules:
        if payload.get('price_per_hour') is not None:
            schedule.price_per_hour = float(payload.get('price_per_hour'))
        if payload.get('status') in ['active', 'inactive']:
            schedule.status = payload.get('status')
        if isinstance(payload.get('is_reserved'), bool):
            schedule.is_reserved = payload.get('is_reserved')
    db.commit()
    return {'updated': len(schedules), 'items': schedules}
