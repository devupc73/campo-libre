from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import Date
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Time

from app.database import Base


class CourtSchedule(Base):
    __tablename__ = 'court_schedules'

    id = Column(Integer, primary_key=True, index=True)
    court_id = Column(Integer, nullable=False)
    calendar_date = Column(Date, nullable=True, index=True)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    price_per_hour = Column(Float, nullable=False, default=0)
    status = Column(String, default='active')
    is_reserved = Column(Boolean, nullable=False, default=False)
