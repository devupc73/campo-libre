from fastapi import APIRouter
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.sports_complex import SportsComplex
from app.schemas.sports_complex import SportsComplexCreate

router = APIRouter(prefix='/sports-complexes', tags=['sports-complexes'])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get('')
def list_complexes():
    db: Session = SessionLocal()
    return db.query(SportsComplex).all()


@router.post('')
def create_complex(payload: SportsComplexCreate):
    db: Session = SessionLocal()
    complex_item = SportsComplex(
        name=payload.name,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(complex_item)
    db.commit()
    db.refresh(complex_item)
    return complex_item


@router.put('/{complex_id}')
def update_complex(complex_id: int, payload: SportsComplexCreate):
    db: Session = SessionLocal()
    complex_item = db.query(SportsComplex).filter(SportsComplex.id == complex_id).first()

    if not complex_item:
        raise HTTPException(status_code=404, detail='Sports complex not found')

    complex_item.name = payload.name
    complex_item.address = payload.address
    complex_item.latitude = payload.latitude
    complex_item.longitude = payload.longitude

    db.commit()
    db.refresh(complex_item)
    return complex_item
