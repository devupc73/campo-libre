from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate

router = APIRouter(prefix='/payments', tags=['payments'])


@router.get('')
def list_payments(reservation_id: int | None = None):
    db: Session = SessionLocal()
    query = db.query(Payment)

    if reservation_id:
        query = query.filter(Payment.reservation_id == reservation_id)

    return query.all()


@router.get('/summary/{reservation_id}')
def payment_summary(reservation_id: int):
    db: Session = SessionLocal()
    payments = db.query(Payment).filter(Payment.reservation_id == reservation_id).all()

    player_total = sum(
        item.amount for item in payments
        if item.payment_flow == 'player_to_captain'
    )
    complex_total = sum(
        item.amount for item in payments
        if item.payment_flow == 'captain_to_complex'
    )

    return {
        'reservation_id': reservation_id,
        'player_contributions_total': player_total,
        'complex_payments_total': complex_total,
        'movement_count': len(payments),
    }


@router.post('')
def create_payment(payload: PaymentCreate):
    db: Session = SessionLocal()

    payment = Payment(
        reservation_id=payload.reservation_id,
        participant_id=payload.participant_id,
        payer_user_id=payload.payer_user_id,
        receiver_user_id=payload.receiver_user_id,
        sports_complex_id=payload.sports_complex_id,
        payment_flow=payload.payment_flow,
        payment_type=payload.payment_type,
        method=payload.method,
        amount=payload.amount,
        status=payload.status,
        reference=payload.reference,
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment
