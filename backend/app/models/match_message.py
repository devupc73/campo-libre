from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class MatchMessage(Base):
    __tablename__ = 'match_messages'

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    message = Column(String, nullable=False)
