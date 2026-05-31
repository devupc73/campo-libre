from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class UserRate(Base):
    __tablename__ = 'user_rates'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    complex_id = Column(Integer, nullable=True)
    court_id = Column(Integer, nullable=True)
    court_schedule_id = Column(Integer, nullable=True)
    price_per_hour = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default='active')
