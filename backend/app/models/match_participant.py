from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class MatchParticipant(Base):
    __tablename__ = 'match_participants'

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    payment_status = Column(String, default='pending')
    payment_method = Column(String, nullable=True)
    paid_amount = Column(Float, default=0)
    paid_players_count = Column(Integer, default=1)
    payment_operation_code = Column(String, nullable=True)
    payment_receipt_url = Column(String, nullable=True)
    payment_validation_status = Column(String, default='pending_validation')
    participant_order = Column(Integer, default=0)
    status = Column(String, default='confirmed')
    position = Column(String, nullable=True)
    skill_level = Column(Integer, default=3)
