from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.court import Court
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.sports_complex import SportsComplex

router = APIRouter(prefix='/reports', tags=['reports'])


@router.get('/system')
def system_report():
    db: Session = SessionLocal()
    complexes = db.query(SportsComplex).count()
    courts = db.query(Court).count()
    reservations = db.query(Reservation).count()
    revenue = sum(item.amount for item in db.query(Payment).all())

    return {
        'complexes': complexes,
        'courts': courts,
        'reservations': reservations,
        'payment_volume': revenue,
    }


@router.get('/complex/{complex_id}')
def complex_report(complex_id: int):
    db: Session = SessionLocal()
    courts = db.query(Court).filter(Court.complex_id == complex_id).all()
    court_ids = [court.id for court in courts]
    reservations = db.query(Reservation).filter(Reservation.court_id.in_(court_ids)).all()
    payments = db.query(Payment).filter(Payment.sports_complex_id == complex_id).all()

    paid_to_complex = sum(item.amount for item in payments)
    reserved_amount = sum(item.total_price for item in reservations)
    active_reservations = len([item for item in reservations if item.status != 'cancelled'])

    return {
        'complex_id': complex_id,
        'courts': len(courts),
        'reservations': len(reservations),
        'active_reservations': active_reservations,
        'reserved_amount': reserved_amount,
        'paid_to_complex': paid_to_complex,
        'pending_collection': reserved_amount - paid_to_complex,
    }
