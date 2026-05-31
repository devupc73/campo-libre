from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.complex_admin_assignment import ComplexAdminAssignment

router = APIRouter(prefix='/complex-admin-assignments', tags=['complex-admin-assignments'])


@router.get('/{admin_user_id}')
def list_assignments(admin_user_id: int, db: Session = Depends(get_db)):
    return db.query(ComplexAdminAssignment).filter(
        ComplexAdminAssignment.admin_user_id == admin_user_id,
        ComplexAdminAssignment.status == 'active',
    ).all()


@router.post('/')
def create_assignment(payload: dict, db: Session = Depends(get_db)):
    entity = ComplexAdminAssignment(
        complex_id=payload.get('complex_id'),
        admin_user_id=payload.get('admin_user_id'),
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity
