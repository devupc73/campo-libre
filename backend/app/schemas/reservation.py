from datetime import datetime

from pydantic import BaseModel


class ReservationCreate(BaseModel):
    court_id: int
    captain_id: int
    start_at: datetime
    end_at: datetime


class ReservationRead(BaseModel):
    id: int
    court_id: int
    captain_id: int
    start_at: datetime
    end_at: datetime
    total_price: float
    status: str

    class Config:
        from_attributes = True
