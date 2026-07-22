from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import text

from app.database import Base
from app.database import engine
from app.models.court import Court
from app.models.court_schedule import CourtSchedule
from app.models.match import Match
from app.models.match_participant import MatchParticipant
from app.models.match_message import MatchMessage
from app.models.participant import Participant
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.sports_complex import SportsComplex
from app.models.user import User
from app.models.user_rate import UserRate
from app.models.wallet import WalletMovement
from app.routes.auth import router as auth_router
from app.routes.availability import router as availability_router
from app.routes.complex_admin import router as complex_admin_router
from app.routes.court_schedule_batch import router as court_schedule_batch_router
from app.routes.court_schedules import router as court_schedules_router
from app.routes.courts import router as courts_router
from app.routes.health import router as health_router
from app.routes.match_messages import router as match_messages_router
from app.routes.match_participants import router as match_participants_router
from app.routes.matches import router as matches_router
from app.routes.payments import router as payments_router
from app.routes.reports import router as reports_router
from app.routes.reservations import router as reservations_router
from app.routes.sports_complexes import router as sports_complexes_router
from app.routes.team_generator import router as team_generator_router
from app.routes.user_rates import router as user_rates_router
from app.routes.users import router as users_router

Base.metadata.create_all(bind=engine)
with engine.begin() as connection:
    connection.execute(text('ALTER TABLE sports_complexes ADD COLUMN IF NOT EXISTS logo_url TEXT'))
    connection.execute(text('ALTER TABLE court_schedules ADD COLUMN IF NOT EXISTS is_reserved BOOLEAN NOT NULL DEFAULT FALSE'))
    connection.execute(text('ALTER TABLE court_schedules ADD COLUMN IF NOT EXISTS calendar_date DATE'))
    connection.execute(text('CREATE INDEX IF NOT EXISTS ix_court_schedules_calendar_date ON court_schedules (calendar_date)'))

app = FastAPI(title='Campo Libre API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def add_defensive_cors_headers(request: Request, call_next):
    if request.method == 'OPTIONS':
        response = Response(status_code=204)
    else:
        response = await call_next(request)

    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courts_router)
app.include_router(court_schedules_router)
app.include_router(court_schedule_batch_router)
app.include_router(reservations_router)
app.include_router(sports_complexes_router)
app.include_router(availability_router)
app.include_router(payments_router)
app.include_router(matches_router)
app.include_router(match_participants_router)
app.include_router(match_messages_router)
app.include_router(team_generator_router)
app.include_router(complex_admin_router)
app.include_router(reports_router)
app.include_router(user_rates_router)


@app.get('/')
def root():
    return {
        'status': 'ok',
        'service': 'campo-libre-api',
    }
