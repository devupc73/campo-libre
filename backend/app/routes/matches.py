from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match import Match
from app.schemas.match import MatchCreate

router = APIRouter(prefix='/matches', tags=['matches'])


@router.get('')
def list_matches():
    db: Session = SessionLocal()
    return db.query(Match).all()


@router.post('')
def create_match(payload: MatchCreate):
    db: Session = SessionLocal()

    match = Match(
        reservation_id=payload.reservation_id,
        captain_user_id=payload.captain_user_id,
        title=payload.title,
        sport=payload.sport,
        max_players=payload.max_players,
    )

    db.add(match)
    db.commit()
    db.refresh(match)

    return match
