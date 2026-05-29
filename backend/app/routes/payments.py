from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate

router = APIRouter(prefix='/payments', tags=['payments'])


@router.get('')
def list_payments():
    db: Session = SessionLocal()
    return db.query(Payment).all()


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
