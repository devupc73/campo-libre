from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class Match(Base):
    __tablename__ = 'matches'

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, nullable=True)
    captain_user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    sport = Column(String, nullable=False, default='futbol')
    max_players = Column(Integer, nullable=False)
    tentative_location = Column(String, nullable=True)
    match_date = Column(String, nullable=True)
    match_time = Column(String, nullable=True)
    payment_deadline = Column(String, nullable=True)
    player_fee = Column(Float, default=0)
    collected_amount = Column(Float, default=0)
    paid_to_complex = Column(Float, default=0)
    accumulated_fund = Column(Float, default=0)
    sports_complex_id = Column(Integer, nullable=True)
    court_id = Column(Integer, nullable=True)
    schedule_id = Column(Integer, nullable=True)
    status = Column(String, default='open')
