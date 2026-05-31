from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.crud.court import CourtCrud
from app.dependencies import get_db
from app.models.court import Court
from app.schemas.court import CourtCreate
from app.schemas.court import CourtRead

router = APIRouter(prefix='/courts', tags=['courts'])


@router.get('/', response_model=list[CourtRead])
def list_courts(complex_id: int | None = None, db: Session = Depends(get_db)):
    if complex_id:
        return CourtCrud.get_by_complex(db, complex_id)

    return CourtCrud.get_all(db)


@router.post('/', response_model=CourtRead)
def create_court(payload: CourtCreate, db: Session = Depends(get_db)):
    return CourtCrud.create(db, payload)


@router.put('/{court_id}', response_model=CourtRead)
def update_court(court_id: int, payload: CourtCreate, db: Session = Depends(get_db)):
    court = db.query(Court).filter(Court.id == court_id).first()

    if not court:
        raise HTTPException(status_code=404, detail='Court not found')

    court.complex_id = payload.complex_id
    court.name = payload.name
    court.sport = payload.sport
    court.capacity = payload.capacity
    court.price_per_hour = payload.price_per_hour

    db.commit()
    db.refresh(court)

    return court


@router.delete('/{court_id}')
def delete_court(court_id: int, db: Session = Depends(get_db)):
    court = db.query(Court).filter(Court.id == court_id).first()

    if not court:
        raise HTTPException(status_code=404, detail='Court not found')

    db.delete(court)
    db.commit()

    return {'message': 'Court deleted'}
