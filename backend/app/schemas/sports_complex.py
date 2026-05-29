from pydantic import BaseModel


class SportsComplexCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    description: str | None = None
    phone: str | None = None
    image_url: str | None = None
    rating: float = 0


class SportsComplexResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    description: str | None = None
    phone: str | None = None
    image_url: str | None = None
    rating: float
    status: str

    class Config:
        from_attributes = True
