from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float

from app.database import Base


class Court(Base):
    __tablename__ = 'courts'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sport = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    price_per_hour = Column(Float, nullable=False)
    status = Column(String, default='available')
