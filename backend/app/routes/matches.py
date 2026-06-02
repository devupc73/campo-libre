from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match import Match
from app.models.match_participant import MatchParticipant
from app.schemas.match import MatchCreate

router = APIRouter(prefix='/matches', tags=['matches'])


@router.get('')
def list_matches(captain_user_id: int | None = None):
    db: Session = SessionLocal()

    query = db.query(Match)

    if captain_user_id:
        query = query.filter(Match.captain_user_id == captain_user_id)

    return query.all()


@router.get('/{match_id}/summary')
def get_match_summary(match_id: int):
    db: Session = SessionLocal()

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    participants = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match_id
    ).all()

    confirmed = [p for p in participants if p.status == 'confirmed']
    reserves = [p for p in participants if p.status == 'waiting_list']
    paid = [p for p in participants if p.payment_status == 'paid']

    collected = sum(float(p.paid_amount or 0) for p in participants)
    fund = collected - float(match.paid_to_complex or 0)

    match.collected_amount = collected
    match.accumulated_fund = fund
    db.commit()

    return {
        'match_id': match.id,
        'title': match.title,
        'confirmed_players': len(confirmed),
        'reserve_players': len(reserves),
        'paid_players': len(paid),
        'pending_players': len(participants) - len(paid),
        'collected_amount': collected,
        'paid_to_complex': match.paid_to_complex,
        'accumulated_fund': fund,
        'occupancy_percentage': round((len(confirmed) / max(match.max_players, 1)) * 100, 2),
    }


@router.post('')
def create_match(payload: MatchCreate):
    db: Session = SessionLocal()

    match = Match(
        reservation_id=payload.reservation_id,
        captain_user_id=payload.captain_user_id,
        title=payload.title,
        sport=payload.sport,
        max_players=payload.max_players,
        tentative_location=payload.tentative_location,
        match_date=payload.match_date,
        match_time=payload.match_time,
        payment_deadline=payload.payment_deadline,
        player_fee=payload.player_fee,
        sports_complex_id=payload.sports_complex_id,
        court_id=payload.court_id,
        schedule_id=payload.schedule_id,
        paid_to_complex=payload.paid_to_complex,
    )

    db.add(match)
    db.commit()
    db.refresh(match)

    return match


@router.put('/{match_id}')
def update_match(match_id: int, payload: MatchCreate):
    db: Session = SessionLocal()

    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    match.title = payload.title
    match.sport = payload.sport
    match.max_players = payload.max_players
    match.tentative_location = payload.tentative_location
    match.match_date = payload.match_date
    match.match_time = payload.match_time
    match.payment_deadline = payload.payment_deadline
    match.player_fee = payload.player_fee
    match.sports_complex_id = payload.sports_complex_id
    match.court_id = payload.court_id
    match.schedule_id = payload.schedule_id
    match.paid_to_complex = payload.paid_to_complex

    db.commit()
    db.refresh(match)

    return match
