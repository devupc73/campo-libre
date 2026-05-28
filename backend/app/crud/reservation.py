from datetime import time

from sqlalchemy.orm import Session

from app.models.court_schedule import CourtSchedule
from app.models.reservation import Reservation
from app.schemas.reservation import ReservationCreate


class ReservationCrud:

    @staticmethod
    def create(db: Session, payload: ReservationCreate):
        overlapping = db.query(Reservation).filter(
            Reservation.court_id == payload.court_id,
            Reservation.status != 'cancelled',
            Reservation.start_at < payload.end_at,
            Reservation.end_at > payload.start_at,
        ).first()

        if overlapping:
            raise ValueError('Selected schedule is already reserved')

        reservation_day = payload.start_at.isoweekday()
        reservation_time = payload.start_at.time()

        schedule = db.query(CourtSchedule).filter(
            CourtSchedule.court_id == payload.court_id,
            CourtSchedule.day_of_week == reservation_day,
            CourtSchedule.start_time <= reservation_time,
            CourtSchedule.end_time >= reservation_time,
            CourtSchedule.status == 'active',
        ).first()

        if not schedule:
            raise ValueError('No pricing schedule configured for this reservation')

        duration_hours = (
            payload.end_at - payload.start_at
        ).total_seconds() / 3600

        total_price = round(duration_hours * schedule.price_per_hour, 2)

        reservation = Reservation(
            court_id=payload.court_id,
            captain_id=payload.captain_id,
            start_at=payload.start_at,
            end_at=payload.end_at,
            total_price=total_price,
            status='reserved',
        )

        db.add(reservation)
        db.commit()
        db.refresh(reservation)
        return reservation

    @staticmethod
    def get_all(db: Session):
        return db.query(Reservation).all()
