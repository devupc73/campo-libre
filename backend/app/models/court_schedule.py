from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Time

from app.database import Base


class CourtSchedule(Base):
    __tablename__ = 'court_schedules'

    id = Column(Integer, primary_key=True, index=True)
    court_id = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String, default='active')
