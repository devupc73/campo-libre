from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.complex_admin_assignment import ComplexAdminAssignment
from app.models.sports_complex import SportsComplex

router = APIRouter(prefix='/complex-admin-bootstrap', tags=['complex-admin-bootstrap'])


@router.get('/complexes/{admin_user_id}')
def list_assigned_complexes(admin_user_id: int, db: Session = Depends(get_db)):
    assignments = db.query(ComplexAdminAssignment).filter(
        ComplexAdminAssignment.admin_user_id == admin_user_id,
        ComplexAdminAssignment.status == 'active',
    ).all()

    complex_ids = [item.complex_id for item in assignments]

    if not complex_ids:
        return []

    return db.query(SportsComplex).filter(SportsComplex.id.in_(complex_ids)).all()
