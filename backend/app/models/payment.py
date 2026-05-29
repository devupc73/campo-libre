from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, nullable=True)
    participant_id = Column(Integer, nullable=True)
    payer_user_id = Column(Integer, nullable=True)
    receiver_user_id = Column(Integer, nullable=True)
    sports_complex_id = Column(Integer, nullable=True)
    payment_flow = Column(String, nullable=False, default='player_to_captain')
    payment_type = Column(String, nullable=False, default='contribution')
    method = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default='pending')
    reference = Column(String, nullable=True)
