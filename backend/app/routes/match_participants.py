from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match import Match
from app.models.match_participant import MatchParticipant
from app.schemas.match_participant import MatchParticipantCreate

router = APIRouter(prefix='/match-participants', tags=['match-participants'])


def refresh_match_amounts(db: Session, match_id: int):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        return

    participants = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match_id
    ).all()
    validated_collected = sum(
        float(p.paid_amount or 0)
        for p in participants
        if p.payment_status == 'paid' and p.payment_validation_status == 'validated'
    )
    match.collected_amount = validated_collected
    match.accumulated_fund = validated_collected - float(match.paid_to_complex or 0)


@router.get('')
def list_participants(match_id: int | None = None, user_id: int | None = None):
    db: Session = SessionLocal()
    query = db.query(MatchParticipant)

    if match_id:
        query = query.filter(MatchParticipant.match_id == match_id)
    if user_id:
        query = query.filter(MatchParticipant.user_id == user_id)

    return query.order_by(MatchParticipant.participant_order.asc()).all()


@router.post('')
def join_match(payload: MatchParticipantCreate):
    db: Session = SessionLocal()

    match = db.query(Match).filter(Match.id == payload.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    existing = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == payload.match_id,
        MatchParticipant.user_id == payload.user_id,
    ).first()

    paid_players_count = max(int(payload.paid_players_count or 1), 1)
    paid_amount = float(payload.paid_amount or 0)

    if existing:
        if existing.payment_validation_status not in ['observed', 'rejected']:
            status_label = {
                'pending_validation': 'pendiente de validación',
                'validated': 'validado',
            }.get(existing.payment_validation_status, existing.payment_validation_status or 'registrado')
            raise HTTPException(
                status_code=409,
                detail=f'Ya registraste un aporte para esta convocatoria. Estado actual: {status_label}.',
            )

        existing.payment_method = payload.payment_method
        existing.paid_amount = paid_amount
        existing.paid_players_count = paid_players_count
        existing.payment_status = 'paid' if paid_amount > 0 else 'pending'
        existing.payment_operation_code = payload.payment_operation_code
        existing.payment_receipt_url = payload.payment_receipt_url
        existing.payment_validation_status = 'pending_validation'

        refresh_match_amounts(db, payload.match_id)
        db.commit()
        db.refresh(existing)
        return existing

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

    payment_status = 'paid' if paid_amount > 0 else 'pending'

    participant = MatchParticipant(
        match_id=payload.match_id,
        user_id=payload.user_id,
        position=payload.position,
        skill_level=payload.skill_level,
        status=status,
        participant_order=total_players + 1,
        payment_method=payload.payment_method,
        paid_amount=paid_amount,
        paid_players_count=paid_players_count,
        payment_status=payment_status,
        payment_operation_code=payload.payment_operation_code,
        payment_receipt_url=payload.payment_receipt_url,
        payment_validation_status='pending_validation',
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    refresh_match_amounts(db, payload.match_id)
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

    if participant.payment_validation_status not in ['observed', 'rejected'] and participant.payment_status == 'paid':
        raise HTTPException(
            status_code=409,
            detail='El aporte ya fue registrado y no puede modificarse mientras esté pendiente o validado.',
        )

    participant.payment_status = 'paid'
    participant.payment_method = payload.get('payment_method', 'yape')
    participant.paid_amount = payload.get('paid_amount', 0)
    participant.paid_players_count = max(int(payload.get('paid_players_count', 1) or 1), 1)
    participant.payment_operation_code = payload.get('payment_operation_code')
    participant.payment_receipt_url = payload.get('payment_receipt_url')
    participant.payment_validation_status = 'pending_validation'

    refresh_match_amounts(db, participant.match_id)
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
        participant.paid_players_count = 1

    refresh_match_amounts(db, participant.match_id)
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
