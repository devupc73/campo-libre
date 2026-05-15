from datetime import datetime
from datetime import timedelta

import jwt

from app.config import settings


def create_access_token(subject: str, expires_minutes: int = 60):
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)

    payload = {
        'sub': subject,
        'exp': expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
