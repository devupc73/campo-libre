from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.user import UserCrud
from app.dependencies import get_db
from app.schemas.auth import LoginRequest
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate
from app.schemas.user import UserRead
from app.security import create_access_token
from app.security_password import verify_password

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/register', response_model=UserRead)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return UserCrud.create(db, payload)


@router.post('/login', response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = UserCrud.get_by_email(db, payload.email)

    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    token = create_access_token(user.email)

    return TokenResponse(
        access_token=token,
    )
