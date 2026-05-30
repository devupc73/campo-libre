from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match_message import MatchMessage

router = APIRouter(prefix='/match-messages', tags=['match-messages'])


@router.get('')
def list_messages(match_id: int):
    db: Session = SessionLocal()
    return db.query(MatchMessage).filter(MatchMessage.match_id == match_id).all()


@router.post('')
def create_message(payload: dict):
    db: Session = SessionLocal()

    message = MatchMessage(
        match_id=payload['match_id'],
        user_id=payload['user_id'],
        message=payload['message'],
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message
