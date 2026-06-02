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
    participant_order = Column(Integer, default=0)
    status = Column(String, default='confirmed')
    position = Column(String, nullable=True)
    skill_level = Column(Integer, default=3)
