from fastapi import APIRouter

from app.schemas.auth import LoginRequest
from app.schemas.auth import TokenResponse
from app.security import create_access_token

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest):
    token = create_access_token(payload.email)

    return TokenResponse(
        access_token=token,
    )
