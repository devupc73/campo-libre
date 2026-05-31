from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String

from app.database import Base


class ComplexAdminAssignment(Base):
    __tablename__ = 'complex_admin_assignments'

    id = Column(Integer, primary_key=True, index=True)
    complex_id = Column(Integer, nullable=False)
    admin_user_id = Column(Integer, nullable=False)
    status = Column(String, default='active')
