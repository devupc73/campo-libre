from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
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


@router.put('/{user_id}', response_model=UserRead)
def update_user(user_id: int, payload: dict, db: Session = Depends(get_db)):
    user = UserCrud.update(db, user_id, payload)

    if not user:
        raise HTTPException(status_code=404, detail='Usuario no encontrado')

    return user


@router.delete('/{user_id}')
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = UserCrud.delete(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail='Usuario no encontrado')

    return {'message': 'Usuario eliminado'}
