from fastapi import APIRouter

router = APIRouter(prefix='/reservations', tags=['reservations'])


@router.get('/')
def list_reservations():
    return []
