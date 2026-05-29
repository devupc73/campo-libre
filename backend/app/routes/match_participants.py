from fastapi import APIRouter
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

    return query.all()


@router.post('')
def join_match(payload: MatchParticipantCreate):
    db: Session = SessionLocal()

    match = db.query(Match).filter(Match.id == payload.match_id).first()
    current_players = db.query(MatchParticipant).filter(MatchParticipant.match_id == payload.match_id).count()

    status = 'confirmed'
    if match and current_players >= match.max_players:
        status = 'waiting_list'

    participant = MatchParticipant(
        match_id=payload.match_id,
        user_id=payload.user_id,
        position=payload.position,
        skill_level=payload.skill_level,
        status=status,
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    return participant
