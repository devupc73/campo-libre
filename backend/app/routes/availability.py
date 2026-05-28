from datetime import date
from datetime import datetime
from datetime import timedelta

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.court_schedule import CourtSchedule
from app.models.reservation import Reservation

router = APIRouter(prefix='/availability', tags=['availability'])


@router.get('')
def list_availability(court_id: int, target_date: date):
    db: Session = SessionLocal()
    day_of_week = target_date.isoweekday()

    schedules = db.query(CourtSchedule).filter(
        CourtSchedule.court_id == court_id,
        CourtSchedule.day_of_week == day_of_week,
        CourtSchedule.status == 'active',
    ).all()

    slots = []

    for schedule in schedules:
        slot_start = datetime.combine(target_date, schedule.start_time)
        schedule_end = datetime.combine(target_date, schedule.end_time)

        while slot_start < schedule_end:
            slot_end = slot_start + timedelta(hours=1)

            if slot_end > schedule_end:
                break

            reserved = db.query(Reservation).filter(
                Reservation.court_id == court_id,
                Reservation.status != 'cancelled',
                Reservation.start_at < slot_end,
                Reservation.end_at > slot_start,
            ).first()

            slots.append({
                'court_id': court_id,
                'start_at': slot_start.isoformat(),
                'end_at': slot_end.isoformat(),
                'price_per_hour': schedule.price_per_hour,
                'total_price': schedule.price_per_hour,
                'available': reserved is None,
            })

            slot_start = slot_end

    return slots
