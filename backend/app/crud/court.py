from sqlalchemy.orm import Session

from app.models.court import Court
from app.schemas.court import CourtCreate


class CourtCrud:

    @staticmethod
    def create(db: Session, payload: CourtCreate):
        court = Court(**payload.model_dump())
        db.add(court)
        db.commit()
        db.refresh(court)
        return court

    @staticmethod
    def get_all(db: Session):
        return db.query(Court).all()
