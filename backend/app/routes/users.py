from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.crud.user import UserCrud
from app.dependencies import get_db
from app.schemas.user import UserCreate
from app.schemas.user import UserRead

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/', response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)):
    return UserCrud.get_all(db)


@router.post('/', response_model=UserRead)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    return UserCrud.create(db, payload)
