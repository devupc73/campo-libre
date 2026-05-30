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

    @staticmethod
    def get_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def update(db: Session, user_id: int, payload: dict):
        user = UserCrud.get_by_id(db, user_id)
        if not user:
            return None

        for field in ['full_name', 'email', 'phone', 'role', 'status']:
            if field in payload:
                setattr(user, field, payload[field])

        if payload.get('password'):
            user.password_hash = hash_password(payload['password'])

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete(db: Session, user_id: int):
        user = UserCrud.get_by_id(db, user_id)
        if not user:
            return None

        db.delete(user)
        db.commit()
        return user
