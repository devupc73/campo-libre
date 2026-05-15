from pydantic import BaseModel


class CourtBase(BaseModel):
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
