from fastapi import APIRouter

router = APIRouter(prefix='/courts', tags=['courts'])


@router.get('/')
def list_courts():
    return []
