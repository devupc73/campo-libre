from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


class UserCrud:

    @staticmethod
    def create(db: Session, payload: UserCreate):
        user = User(**payload.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_all(db: Session):
        return db.query(User).all()
