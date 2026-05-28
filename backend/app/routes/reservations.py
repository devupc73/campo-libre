from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.reservation import ReservationCrud
from app.dependencies import get_db
from app.schemas.reservation import ReservationCreate
from app.schemas.reservation import ReservationRead

router = APIRouter(prefix='/reservations', tags=['reservations'])


@router.get('/', response_model=list[ReservationRead])
def list_reservations(db: Session = Depends(get_db)):
    return ReservationCrud.get_all(db)


@router.post('/', response_model=ReservationRead)
def create_reservation(
    payload: ReservationCreate,
    db: Session = Depends(get_db),
):
    try:
        return ReservationCrud.create(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
