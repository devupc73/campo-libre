from pydantic import BaseModel


class CourtBase(BaseModel):
    complex_id: int | None = None
    name: str
    sport: str
    capacity: int
    price_per_hour: float


class CourtCreate(CourtBase):
    pass


class CourtRead(CourtBase):
    id: int
    status: str

    class Config:
        from_attributes = True
