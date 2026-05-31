from pydantic import BaseModel


class UserRateCreate(BaseModel):
    user_id: int
    complex_id: int | None = None
    court_id: int | None = None
    court_schedule_id: int | None = None
    price_per_hour: float
    description: str | None = None
    status: str = 'active'


class UserRateRead(UserRateCreate):
    id: int

    class Config:
        from_attributes = True
