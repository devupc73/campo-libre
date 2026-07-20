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
        SportsComplex.complex_admin_user_id == admin_user_id,
        SportsComplex.status != 'inactive',
    ).all()

    try:
        assignments = db.query(ComplexAdminAssignment).filter(
            ComplexAdminAssignment.admin_user_id == admin_user_id,
            ComplexAdminAssignment.status == 'active',
        ).all()

        complex_ids = [item.complex_id for item in assignments]

        if complex_ids:
            assigned_complexes = db.query(SportsComplex).filter(
                SportsComplex.id.in_(complex_ids),
                SportsComplex.status != 'inactive',
            ).all()
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
    complex_item = db.query(SportsComplex).filter(
        SportsComplex.id == complex_id,
        SportsComplex.status != 'inactive',
    ).first()
    if not complex_item:
        raise HTTPException(status_code=404, detail='Complejo no encontrado o inactivo')

    return db.query(Match).filter(
        Match.sports_complex_id == complex_id,
        Match.paid_to_complex > 0,
    ).order_by(Match.id.desc()).all()


@router.put('/match-payments/{match_id}/validation')
def validate_match_payment(match_id: int, payload: dict):
    db: Session = SessionLocal()
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    complex_id = payload.get('complex_id')
    if not complex_id:
        raise HTTPException(status_code=400, detail='El complejo es obligatorio para validar el pago')

    complex_item = db.query(SportsComplex).filter(
        SportsComplex.id == complex_id,
        SportsComplex.status != 'inactive',
    ).first()
    if not complex_item:
        raise HTTPException(status_code=403, detail='El complejo está inactivo')

    if int(match.sports_complex_id or 0) != int(complex_id):
        raise HTTPException(status_code=403, detail='La convocatoria no pertenece al complejo seleccionado')

    validation_status = payload.get('complex_payment_validation_status')
    if validation_status not in ['validated', 'observed', 'rejected', 'pending_validation']:
        raise HTTPException(status_code=400, detail='Estado de validación inválido')

    if not match.paid_to_complex or float(match.paid_to_complex) <= 0:
        raise HTTPException(status_code=400, detail='La convocatoria no tiene un pago registrado hacia el complejo')

    if not match.court_id or not match.schedule_id:
        raise HTTPException(status_code=400, detail='La convocatoria debe estar asociada a un campo y una franja')

    court = db.query(Court).filter(Court.id == match.court_id).first()
    if not court or int(court.complex_id or 0) != int(complex_id):
        raise HTTPException(status_code=400, detail='El campo asociado no pertenece al complejo')

    schedule = db.query(CourtSchedule).filter(CourtSchedule.id == match.schedule_id).first()
    if not schedule or int(schedule.court_id or 0) != int(match.court_id):
        raise HTTPException(status_code=400, detail='La franja asociada no pertenece al campo')

    if validation_status == 'validated':
        conflicting_match = db.query(Match).filter(
            Match.schedule_id == schedule.id,
            Match.id != match.id,
            Match.complex_payment_validation_status == 'validated',
        ).first()
        if conflicting_match:
            raise HTTPException(status_code=409, detail='La franja ya fue reservada por otra convocatoria validada')

    match.complex_payment_validation_status = validation_status

    if validation_status == 'validated':
        schedule.is_reserved = True
    elif validation_status in ['rejected', 'observed', 'pending_validation']:
        other_validated_match = db.query(Match).filter(
            Match.schedule_id == schedule.id,
            Match.id != match.id,
            Match.complex_payment_validation_status == 'validated',
        ).first()
        if not other_validated_match:
            schedule.is_reserved = False

    db.commit()
    db.refresh(match)
    db.refresh(schedule)

    return {
        'id': match.id,
        'sports_complex_id': match.sports_complex_id,
        'court_id': match.court_id,
        'schedule_id': match.schedule_id,
        'complex_payment_validation_status': match.complex_payment_validation_status,
        'schedule_status': schedule.status,
        'schedule_is_reserved': bool(schedule.is_reserved),
        'message': 'Validación actualizada correctamente',
    }
