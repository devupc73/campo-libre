from pydantic import BaseModel


class MatchParticipantCreate(BaseModel):
    match_id: int
    user_id: int
    position: str | None = None
    skill_level: int = 3
    payment_method: str | None = None
    paid_amount: float = 0


class MatchParticipantRead(MatchParticipantCreate):
    id: int
    status: str
    payment_status: str
    participant_order: int

    class Config:
        from_attributes = True
