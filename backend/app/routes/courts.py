from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.crud.court import CourtCrud
from app.dependencies import get_db
from app.models.court import Court
from app.models.court_schedule import CourtSchedule
from app.models.match import Match
from app.schemas.court import CourtCreate
from app.schemas.court import CourtRead

router = APIRouter(prefix='/courts', tags=['courts'])


@router.get('/', response_model=list[CourtRead])
def list_courts(complex_id: int | None = None, db: Session = Depends(get_db)):
    if complex_id is not None:
        return CourtCrud.get_by_complex(db, complex_id)
    return CourtCrud.get_all(db)


@router.post('/', response_model=CourtRead, status_code=201)
def create_court(payload: CourtCreate, db: Session = Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail='El nombre del campo es obligatorio')
    if payload.capacity <= 0:
        raise HTTPException(status_code=400, detail='La capacidad debe ser mayor a cero')
    return CourtCrud.create(db, payload)


@router.put('/{court_id}', response_model=CourtRead)
def update_court(court_id: int, payload: CourtCreate, db: Session = Depends(get_db)):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail='Campo no encontrado')
    if court.complex_id != payload.complex_id:
        raise HTTPException(status_code=400, detail='No se puede mover el campo a otro complejo')
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail='El nombre del campo es obligatorio')
    if payload.capacity <= 0:
        raise HTTPException(status_code=400, detail='La capacidad debe ser mayor a cero')

    court.name = payload.name.strip()
    court.sport = payload.sport.strip()
    court.capacity = payload.capacity
    court.price_per_hour = payload.price_per_hour

    try:
        db.commit()
        db.refresh(court)
        return court
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail='No se pudo actualizar el campo') from exc


@router.delete('/{court_id}')
def delete_court(court_id: int, db: Session = Depends(get_db)):
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail='Campo no encontrado')

    linked_matches = db.query(Match).filter(Match.court_id == court_id).all()
    for match in linked_matches:
        match.court_id = None
        match.schedule_id = None
        match.sports_complex_id = None
        match.complex_payment_validation_status = None

    db.query(CourtSchedule).filter(CourtSchedule.court_id == court_id).delete(synchronize_session=False)
    db.delete(court)

    try:
        db.commit()
        return {
            'message': 'Campo eliminado',
            'unlinked_matches': len(linked_matches),
        }
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail='El campo no pudo eliminarse porque tiene información relacionada') from exc
