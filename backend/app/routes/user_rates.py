from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.user_rate import UserRate
from app.schemas.user_rate import UserRateCreate
from app.schemas.user_rate import UserRateRead

router = APIRouter(prefix='/user-rates', tags=['user-rates'])


@router.get('/', response_model=list[UserRateRead])
def list_user_rates(db: Session = Depends(get_db)):
    return db.query(UserRate).all()


@router.post('/', response_model=UserRateRead)
def create_user_rate(payload: UserRateCreate, db: Session = Depends(get_db)):
    entity = UserRate(**payload.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity
