from sqlalchemy.orm import Session

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

        reservation = Reservation(**payload.model_dump())
        db.add(reservation)
        db.commit()
        db.refresh(reservation)
        return reservation

    @staticmethod
    def get_all(db: Session):
        return db.query(Reservation).all()
