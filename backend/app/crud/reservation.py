from sqlalchemy.orm import Session

from app.models.reservation import Reservation
from app.schemas.reservation import ReservationCreate


class ReservationCrud:

    @staticmethod
    def create(db: Session, payload: ReservationCreate):
        reservation = Reservation(**payload.model_dump())
        db.add(reservation)
        db.commit()
        db.refresh(reservation)
        return reservation

    @staticmethod
    def get_all(db: Session):
        return db.query(Reservation).all()
