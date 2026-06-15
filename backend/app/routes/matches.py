from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match import Match
from app.models.match_participant import MatchParticipant
from app.schemas.match import MatchCreate

router = APIRouter(prefix='/matches', tags=['matches'])


def build_match_summary(match: Match, participants: list[MatchParticipant]):
    confirmed = [p for p in participants if p.status == 'confirmed']
    reserves = [p for p in participants if p.status == 'waiting_list']
    paid = [p for p in participants if p.payment_status == 'paid']
    validated = [p for p in participants if p.payment_validation_status == 'validated']
    pending_validation = [p for p in participants if p.payment_validation_status == 'pending_validation' and p.payment_status == 'paid']
    collected = sum(float(p.paid_amount or 0) for p in participants if p.payment_status == 'paid')
    validated_collected = sum(float(p.paid_amount or 0) for p in validated)
    fund = collected - float(match.paid_to_complex or 0)

    match.collected_amount = collected
    match.accumulated_fund = fund

    return {
        'id': match.id,
        'reservation_id': match.reservation_id,
        'captain_user_id': match.captain_user_id,
        'title': match.title,
        'sport': match.sport,
        'max_players': match.max_players,
        'tentative_location': match.tentative_location,
        'match_date': match.match_date,
        'match_time': match.match_time,
        'payment_deadline': match.payment_deadline,
        'player_fee': match.player_fee,
        'collected_amount': collected,
        'validated_collected_amount': validated_collected,
        'paid_to_complex': match.paid_to_complex,
        'accumulated_fund': fund,
        'sports_complex_id': match.sports_complex_id,
        'court_id': match.court_id,
        'schedule_id': match.schedule_id,
        'status': match.status,
        'total_players': len(participants),
        'confirmed_players': len(confirmed),
        'reserve_players': len(reserves),
        'paid_players': len(paid),
        'validated_paid_players': len(validated),
        'pending_validation_players': len(pending_validation),
        'available_slots': max(int(match.max_players or 0) - len(confirmed), 0),
        'occupancy_percentage': round((len(confirmed) / max(int(match.max_players or 1), 1)) * 100, 2),
    }


@router.get('')
def list_matches(captain_user_id: int | None = None):
    db: Session = SessionLocal()
    query = db.query(Match)

    if captain_user_id:
        query = query.filter(Match.captain_user_id == captain_user_id)

    matches = query.all()
    result = []

    for match in matches:
        participants = db.query(MatchParticipant).filter(
            MatchParticipant.match_id == match.id
        ).all()
        result.append(build_match_summary(match, participants))

    db.commit()
    return result


@router.get('/{match_id}/summary')
def get_match_summary(match_id: int):
    db: Session = SessionLocal()

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail='Convocatoria no encontrada')

    participants = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match_id
    ).all()

    summary = build_match_summary(match, participants)
    summary['match_id'] = match.id
    db.commit()
    return summary


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
