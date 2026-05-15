from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.security_password import hash_password


class UserCrud:

    @staticmethod
    def create(db: Session, payload: UserCreate):
        data = payload.model_dump()
        password = data.pop('password')

        user = User(
            **data,
            password_hash=hash_password(password),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def get_all(db: Session):
        return db.query(User).all()

    @staticmethod
    def get_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
