from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.complex_admin_assignment import ComplexAdminAssignment
from app.models.court import Court
from app.models.court_rate import CourtRate
from app.models.court_schedule import CourtSchedule
from app.models.match import Match
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.sports_complex import SportsComplex

router = APIRouter(prefix='/complex-admin', tags=['complex-admin'])


@router.get('/complexes/{admin_user_id}')
def get_admin_complexes(admin_user_id: int):
    db: Session = SessionLocal()

    direct_complexes = db.query(SportsComplex).filter(
        SportsComplex.complex_admin_user_id == admin_user_id
    ).all()

    try:
        assignments = db.query(ComplexAdminAssignment).filter(
            ComplexAdminAssignment.admin_user_id == admin_user_id,
            ComplexAdminAssignment.status == 'active',
        ).all()

        complex_ids = [item.complex_id for item in assignments]

        if complex_ids:
            assigned_complexes = db.query(SportsComplex).filter(SportsComplex.id.in_(complex_ids)).all()
            merged = {item.id: item for item in direct_complexes + assigned_complexes}
            return list(merged.values())
    except Exception:
        return direct_complexes

    return direct_complexes


@router.post('/assignments')
def create_admin_assignment(payload: dict):
    db: Session = SessionLocal()

    complex_id = payload.get('complex_id')
    admin_user_id = payload.get('admin_user_id')

    complex_item = db.query(SportsComplex).filter(SportsComplex.id == complex_id).first()
    if complex_item:
        complex_item.complex_admin_user_id = admin_user_id
        db.commit()
        db.refresh(complex_item)

    try:
        previous_assignments = db.query(ComplexAdminAssignment).filter(
            ComplexAdminAssignment.complex_id == complex_id,
            ComplexAdminAssignment.status == 'active',
        ).all()

        for assignment in previous_assignments:
            assignment.status = 'inactive'

        existing = db.query(ComplexAdminAssignment).filter(
            ComplexAdminAssignment.complex_id == complex_id,
            ComplexAdminAssignment.admin_user_id == admin_user_id,
        ).first()

        if existing:
            existing.status = 'active'
            db.commit()
            db.refresh(existing)
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
    except Exception:
        return {
            'complex_id': complex_id,
            'admin_user_id': admin_user_id,
            'status': 'active',
            'source': 'sports_complex_fallback',
        }


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


@router.get('/match-payments/{complex_id}')
def get_match_payments_for_complex(complex_id: int):
    db: Session = SessionLocal()
    return db.query(Match).filter(
        Match.sports_complex_id == complex_id,
        Match.paid_to_complex > 0,
    ).all()


@router.put('/match-payments/{match_id}/validation')
def validate_match_payment(match_id: int, payload: dict):
    db: Session = SessionLocal()
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    validation_status = payload.get('complex_payment_validation_status')
    if validation_status not in ['validated', 'observed', 'rejected', 'pending_validation']:
        raise HTTPException(status_code=400, detail='Estado de validación inválido')

    match.complex_payment_validation_status = validation_status

    if validation_status == 'validated' and match.schedule_id:
        schedule = db.query(CourtSchedule).filter(CourtSchedule.id == match.schedule_id).first()
        if schedule:
            schedule.status = 'reserved'

    if validation_status in ['rejected', 'observed'] and match.schedule_id:
        schedule = db.query(CourtSchedule).filter(CourtSchedule.id == match.schedule_id).first()
        if schedule and schedule.status == 'reserved':
            schedule.status = 'active'

    db.commit()
    db.refresh(match)
    return match
