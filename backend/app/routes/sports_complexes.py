import json
from urllib.error import HTTPError
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request
from urllib.request import urlopen

from fastapi import APIRouter
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.sports_complex import SportsComplex
from app.models.user import User
from app.schemas.sports_complex import SportsComplexCreate

router = APIRouter(prefix='/sports-complexes', tags=['sports-complexes'])


class SportsComplexStatusUpdate(BaseModel):
    status: str
    system_admin_user_id: int


def apply_payload(complex_item: SportsComplex, payload: SportsComplexCreate):
    complex_item.name = payload.name
    complex_item.address = payload.address
    complex_item.latitude = payload.latitude
    complex_item.longitude = payload.longitude
    complex_item.system_admin_user_id = payload.system_admin_user_id
    complex_item.complex_admin_user_id = payload.complex_admin_user_id
    complex_item.description = payload.description
    complex_item.phone = payload.phone
    complex_item.image_url = payload.image_url
    complex_item.logo_url = payload.logo_url
    complex_item.rating = payload.rating
    return complex_item


@router.get('/geocode')
def geocode_address(address: str):
    normalized_address = address.strip()
    if len(normalized_address) < 5:
        raise HTTPException(status_code=400, detail='Ingresa una dirección más específica')

    query = urlencode({
        'q': normalized_address,
        'format': 'jsonv2',
        'limit': 1,
        'addressdetails': 1,
        'countrycodes': 'pe',
    })
    request = Request(
        f'https://nominatim.openstreetmap.org/search?{query}',
        headers={
            'User-Agent': 'CampoLibre/1.0 (sports-complex-geocoding)',
            'Accept-Language': 'es',
        },
    )

    try:
        with urlopen(request, timeout=12) as response:
            results = json.loads(response.read().decode('utf-8'))
    except (HTTPError, URLError, TimeoutError, ValueError) as error:
        raise HTTPException(status_code=502, detail='No fue posible consultar el servicio de ubicación') from error

    if not results:
        raise HTTPException(status_code=404, detail='No se encontró la dirección. Agrega distrito, provincia y país')

    result = results[0]
    try:
        latitude = float(result['lat'])
        longitude = float(result['lon'])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail='El servicio de ubicación devolvió coordenadas inválidas') from error

    return {
        'address': normalized_address,
        'display_name': result.get('display_name', normalized_address),
        'latitude': latitude,
        'longitude': longitude,
    }


@router.get('')
def list_complexes(include_inactive: bool = False):
    db: Session = SessionLocal()
    query = db.query(SportsComplex)
    if not include_inactive:
        query = query.filter(or_(SportsComplex.status.is_(None), SportsComplex.status != 'inactive'))
    return query.order_by(SportsComplex.name.asc()).all()


@router.post('')
def create_complex(payload: SportsComplexCreate):
    db: Session = SessionLocal()
    complex_item = apply_payload(SportsComplex(status='active'), payload)
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

    apply_payload(complex_item, payload)
    db.commit()
    db.refresh(complex_item)
    return complex_item


@router.put('/{complex_id}/status')
def update_complex_status(complex_id: int, payload: SportsComplexStatusUpdate):
    db: Session = SessionLocal()

    administrator = db.query(User).filter(User.id == payload.system_admin_user_id).first()
    if not administrator or administrator.role != 'system_admin':
        raise HTTPException(status_code=403, detail='Solo un administrador del sistema puede cambiar el estado del complejo')

    normalized_status = payload.status.strip().lower()
    if normalized_status not in ['active', 'inactive']:
        raise HTTPException(status_code=400, detail='Estado de complejo inválido')

    complex_item = db.query(SportsComplex).filter(SportsComplex.id == complex_id).first()
    if not complex_item:
        raise HTTPException(status_code=404, detail='Complejo no encontrado')

    complex_item.status = normalized_status
    db.commit()
    db.refresh(complex_item)
    return complex_item


@router.delete('/{complex_id}')
def delete_complex(complex_id: int):
    db: Session = SessionLocal()

    complex_item = db.query(SportsComplex).filter(SportsComplex.id == complex_id).first()

    if not complex_item:
        raise HTTPException(status_code=404, detail='Sports complex not found')

    db.delete(complex_item)
    db.commit()

    return {'message': 'Sports complex deleted'}
