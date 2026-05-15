from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.crud.court import CourtCrud
from app.dependencies import get_db
from app.schemas.court import CourtCreate
from app.schemas.court import CourtRead

router = APIRouter(prefix='/courts', tags=['courts'])


@router.get('/', response_model=list[CourtRead])
def list_courts(db: Session = Depends(get_db)):
    return CourtCrud.get_all(db)


@router.post('/', response_model=CourtRead)
def create_court(payload: CourtCreate, db: Session = Depends(get_db)):
    return CourtCrud.create(db, payload)
