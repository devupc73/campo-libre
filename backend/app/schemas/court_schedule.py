from datetime import time

from pydantic import BaseModel


class CourtScheduleBase(BaseModel):
    court_id: int
    day_of_week: int
    start_time: time
    end_time: time
    price_per_hour: float
    status: str = 'active'
    is_reserved: bool = False


class CourtScheduleCreate(CourtScheduleBase):
    pass


class CourtScheduleRead(CourtScheduleBase):
    id: int

    class Config:
        from_attributes = True
