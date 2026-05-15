from fastapi import FastAPI

from app.database import Base
from app.database import engine
from app.models.court import Court
from app.models.participant import Participant
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.user import User
from app.models.wallet import WalletMovement
from app.routes.auth import router as auth_router
from app.routes.courts import router as courts_router
from app.routes.health import router as health_router
from app.routes.reservations import router as reservations_router
from app.routes.users import router as users_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title='Campo Libre API')

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courts_router)
app.include_router(reservations_router)


@app.get('/')
def root():
    return {
        'status': 'ok',
        'service': 'campo-libre-api',
    }
