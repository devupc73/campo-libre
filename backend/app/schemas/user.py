from pydantic import BaseModel


class UserBase(BaseModel):
    full_name: str
    email: str
    phone: str | None = None
    role: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    status: str

    class Config:
        from_attributes = True
