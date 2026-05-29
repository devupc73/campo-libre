from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class Match(Base):
    __tablename__ = 'matches'

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, nullable=False)
    captain_user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    sport = Column(String, nullable=False, default='futbol')
    max_players = Column(Integer, nullable=False)
    status = Column(String, default='open')
