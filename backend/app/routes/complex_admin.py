from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.complex_admin_assignment import ComplexAdminAssignment
from app.models.court import Court
from app.models.court_rate import CourtRate
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.sports_complex import SportsComplex

router = APIRouter(prefix='/complex-admin', tags=['complex-admin'])


@router.get('/complexes/{admin_user_id}')
def get_admin_complexes(admin_user_id: int):
    db: Session = SessionLocal()

    assignments = db.query(ComplexAdminAssignment).filter(
        ComplexAdminAssignment.admin_user_id == admin_user_id,
        ComplexAdminAssignment.status == 'active',
    ).all()

    complex_ids = [item.complex_id for item in assignments]

    if complex_ids:
        return db.query(SportsComplex).filter(SportsComplex.id.in_(complex_ids)).all()

    return db.query(SportsComplex).filter(
        SportsComplex.complex_admin_user_id == admin_user_id
    ).all()


@router.post('/assignments')
def create_admin_assignment(payload: dict):
    db: Session = SessionLocal()

    complex_id = payload.get('complex_id')
    admin_user_id = payload.get('admin_user_id')

    existing = db.query(ComplexAdminAssignment).filter(
        ComplexAdminAssignment.complex_id == complex_id,
        ComplexAdminAssignment.admin_user_id == admin_user_id,
        ComplexAdminAssignment.status == 'active',
    ).first()

    if existing:
        return existing

    entity = ComplexAdminAssignment(
        complex_id=complex_id,
        admin_user_id=admin_user_id,
        status='active',
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get('/court-rates/{complex_id}')
def list_court_rates(complex_id: int):
    db: Session = SessionLocal()
    return db.query(CourtRate).filter(
        CourtRate.complex_id == complex_id,
        CourtRate.status == 'active',
    ).all()


@router.post('/court-rates')
def create_court_rate(payload: dict):
    db: Session = SessionLocal()

    entity = CourtRate(
        complex_id=payload.get('complex_id'),
        court_id=payload.get('court_id'),
        day_of_week=payload.get('day_of_week'),
        start_time=payload.get('start_time'),
        end_time=payload.get('end_time'),
        price_per_hour=payload.get('price_per_hour'),
        description=payload.get('description'),
        status='active',
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


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
