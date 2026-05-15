from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer
import jwt

from app.config import settings

bearer_scheme = HTTPBearer()


def get_current_subject(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload.get('sub')
    except Exception as exc:
        raise HTTPException(status_code=401, detail='Invalid token') from exc
