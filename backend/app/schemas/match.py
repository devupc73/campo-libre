from pydantic import BaseModel


class MatchCreate(BaseModel):
    reservation_id: int | None = None
    captain_user_id: int
    title: str
    sport: str = 'futbol'
    max_players: int
    tentative_location: str | None = None
    match_date: str | None = None
    match_time: str | None = None
    payment_deadline: str | None = None
    player_fee: float = 0
    sports_complex_id: int | None = None
    court_id: int | None = None
    schedule_id: int | None = None
    paid_to_complex: float = 0


class MatchRead(MatchCreate):
    id: int
    collected_amount: float
    accumulated_fund: float
    status: str

    class Config:
        from_attributes = True
