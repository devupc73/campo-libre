from pydantic import BaseModel


class MatchCreate(BaseModel):
    reservation_id: int
    captain_user_id: int
    title: str
    sport: str = 'futbol'
    max_players: int


class MatchRead(MatchCreate):
    id: int
    status: str

    class Config:
        from_attributes = True
