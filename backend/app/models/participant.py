from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class Participant(Base):
    __tablename__ = 'participants'

    id = Column(Integer, primary_key=True, index=True)
    invitation_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    participant_type = Column(String, default='titular')
    payment_status = Column(String, default='pending')
    attendance_status = Column(String, default='registered')
