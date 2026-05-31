from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class CourtRate(Base):
    __tablename__ = 'court_rates'

    id = Column(Integer, primary_key=True, index=True)
    complex_id = Column(Integer, nullable=False)
    court_id = Column(Integer, nullable=False)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    price_per_hour = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default='active')
