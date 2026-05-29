from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.match_participant import MatchParticipant

router = APIRouter(prefix='/team-generator', tags=['team-generator'])


@router.get('/{match_id}')
def generate_teams(match_id: int):
    db: Session = SessionLocal()

    participants = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match_id,
        MatchParticipant.status == 'confirmed',
    ).all()

    ordered = sorted(participants, key=lambda item: item.skill_level, reverse=True)

    team_a = []
    team_b = []

    total_a = 0
    total_b = 0

    for participant in ordered:
        if total_a <= total_b:
            team_a.append(participant.user_id)
            total_a += participant.skill_level
        else:
            team_b.append(participant.user_id)
            total_b += participant.skill_level

    return {
        'match_id': match_id,
        'team_a': team_a,
        'team_b': team_b,
        'team_a_skill': total_a,
        'team_b_skill': total_b,
    }
