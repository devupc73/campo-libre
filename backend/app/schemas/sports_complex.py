from pydantic import BaseModel


class SportsComplexCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float


class SportsComplexResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    status: str

    class Config:
        from_attributes = True
