from pydantic import BaseModel
from pydantic import field_validator


class UserBase(BaseModel):
    full_name: str
    email: str
    phone: str | None = None
    role: str

    @field_validator('full_name', 'role')
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError('Field must not be empty')
        return normalized

    @field_validator('email')
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if '@' not in normalized or normalized.startswith('@') or normalized.endswith('@'):
            raise ValueError('Invalid email address')
        return normalized

    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError('Password must contain at least 8 characters')
        if len(value.encode('utf-8')) > 72:
            raise ValueError('Password must not exceed 72 bytes')
        return value


class UserRead(UserBase):
    id: int
    status: str

    class Config:
        from_attributes = True
