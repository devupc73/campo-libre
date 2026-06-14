from datetime import time

from fastapi import APIRouter
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
            else:
                schedule = CourtSchedule(
                    court_id=item.get('court_id'),
                    day_of_week=item.get('day_of_week'),
                    start_time=start_time,
                    end_time=end_time,
                    price_per_hour=item.get('price_per_hour', 0),
                    status=item.get('status', 'active'),
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
