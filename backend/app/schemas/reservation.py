from datetime import datetime

from pydantic import BaseModel


class ReservationBase(BaseModel):
    court_id: int
    captain_id: int
    start_at: datetime
    end_at: datetime
    total_price: float


class ReservationCreate(ReservationBase):
    pass


class ReservationRead(ReservationBase):
    id: int
    status: str

    class Config:
        from_attributes = True
