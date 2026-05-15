from fastapi import FastAPI

from app.routes.auth import router as auth_router
from app.routes.courts import router as courts_router
from app.routes.health import router as health_router
from app.routes.reservations import router as reservations_router
from app.routes.users import router as users_router

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
