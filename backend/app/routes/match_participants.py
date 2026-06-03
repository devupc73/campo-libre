from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match import Match
from app.models.match_participant import MatchParticipant
from app.schemas.match_participant import MatchParticipantCreate

router = APIRouter(prefix='/match-participants', tags=['match-participants'])


@router.get('')
def list_participants(match_id: int | None = None):
    db: Session = SessionLocal()
    query = db.query(MatchParticipant)

    if match_id:
        query = query.filter(MatchParticipant.match_id == match_id)

    return query.order_by(MatchParticipant.participant_order.asc()).all()


@router.post('')
def join_match(payload: MatchParticipantCreate):
    db: Session = SessionLocal()

    existing = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == payload.match_id,
        MatchParticipant.user_id == payload.user_id,
    ).first()

    if existing:
        return existing

    match = db.query(Match).filter(Match.id == payload.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    confirmed_players = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == payload.match_id,
        MatchParticipant.status == 'confirmed',
    ).count()

    total_players = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == payload.match_id,
    ).count()

    status = 'confirmed'
    if confirmed_players >= match.max_players:
        status = 'waiting_list'

    payment_status = 'pending'
    validation_status = 'pending_validation'
    if float(payload.paid_amount or 0) > 0:
        payment_status = 'paid'

    participant = MatchParticipant(
        match_id=payload.match_id,
        user_id=payload.user_id,
        position=payload.position,
        skill_level=payload.skill_level,
        status=status,
        participant_order=total_players + 1,
        payment_method=payload.payment_method,
        paid_amount=payload.paid_amount,
        payment_status=payment_status,
        payment_operation_code=payload.payment_operation_code,
        payment_receipt_url=payload.payment_receipt_url,
        payment_validation_status=validation_status,
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    return participant


@router.put('/{participant_id}/payment')
def register_payment(participant_id: int, payload: dict):
    db: Session = SessionLocal()

    participant = db.query(MatchParticipant).filter(
        MatchParticipant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail='Participante no encontrado')

    participant.payment_status = 'paid'
    participant.payment_method = payload.get('payment_method', 'yape')
    participant.paid_amount = payload.get('paid_amount', 0)
    participant.payment_operation_code = payload.get('payment_operation_code')
    participant.payment_receipt_url = payload.get('payment_receipt_url')
    participant.payment_validation_status = 'pending_validation'

    db.commit()
    db.refresh(participant)

    return participant


@router.put('/{participant_id}/payment-validation')
def validate_payment(participant_id: int, payload: dict):
    db: Session = SessionLocal()

    participant = db.query(MatchParticipant).filter(
        MatchParticipant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail='Participante no encontrado')

    validation_status = payload.get('payment_validation_status')
    if validation_status not in ['validated', 'observed', 'rejected', 'pending_validation']:
        raise HTTPException(status_code=400, detail='Estado de validación inválido')

    participant.payment_validation_status = validation_status

    if validation_status == 'rejected':
        participant.payment_status = 'pending'
        participant.paid_amount = 0

    db.commit()
    db.refresh(participant)

    return participant


@router.put('/{participant_id}/order')
def update_order(participant_id: int, payload: dict):
    db: Session = SessionLocal()

    participant = db.query(MatchParticipant).filter(
        MatchParticipant.id == participant_id
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail='Participante no encontrado')

    participant.participant_order = payload.get('participant_order', participant.participant_order)

    if payload.get('status'):
        participant.status = payload.get('status')

    db.commit()
    db.refresh(participant)

    return participant
