from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class WalletMovement(Base):
    __tablename__ = 'wallet_movements'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    movement_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    source = Column(String, nullable=True)
