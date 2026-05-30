from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.court import Court
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.sports_complex import SportsComplex

router = APIRouter(prefix='/complex-admin', tags=['complex-admin'])


@router.get('/complexes/{admin_user_id}')
def get_admin_complexes(admin_user_id: int):
    db: Session = SessionLocal()

    return db.query(SportsComplex).filter(
        SportsComplex.complex_admin_user_id == admin_user_id
    ).all()


@router.get('/reservations/{complex_id}')
def get_complex_reservations(complex_id: int):
    db: Session = SessionLocal()

    courts = db.query(Court).filter(Court.complex_id == complex_id).all()
    court_ids = [court.id for court in courts]

    return db.query(Reservation).filter(
        Reservation.court_id.in_(court_ids)
    ).all()


@router.get('/payments/{complex_id}')
def get_complex_payments(complex_id: int):
    db: Session = SessionLocal()

    return db.query(Payment).filter(
        Payment.sports_complex_id == complex_id
    ).all()
