from pydantic import BaseModel


class MatchParticipantCreate(BaseModel):
    match_id: int
    user_id: int
    position: str | None = None
    skill_level: int = 3
    payment_method: str | None = None
    paid_amount: float = 0
    paid_players_count: int = 1
    payment_operation_code: str | None = None
    payment_receipt_url: str | None = None


class MatchParticipantRead(MatchParticipantCreate):
    id: int
    status: str
    payment_status: str
    payment_validation_status: str
    participant_order: int

    class Config:
        from_attributes = True
