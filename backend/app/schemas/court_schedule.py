from datetime import time

from pydantic import BaseModel


class CourtScheduleBase(BaseModel):
    court_id: int
    day_of_week: int
    start_time: time
    end_time: time
    price_per_hour: float


class CourtScheduleCreate(CourtScheduleBase):
    pass


class CourtScheduleRead(CourtScheduleBase):
    id: int
    status: str

    class Config:
        from_attributes = True
