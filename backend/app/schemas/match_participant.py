from pydantic import BaseModel


class MatchParticipantCreate(BaseModel):
    match_id: int
    user_id: int
    position: str | None = None
    skill_level: int = 3


class MatchParticipantRead(MatchParticipantCreate):
    id: int
    status: str

    class Config:
        from_attributes = True
