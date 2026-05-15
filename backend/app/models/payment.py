from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, nullable=False)
    method = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default='pending')
