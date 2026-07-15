from sqlalchemy import URL
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings


def build_database_url():
    if settings.database_url:
        return settings.database_url

    return URL.create(
        drivername='postgresql+psycopg2',
        username=settings.postgres_user,
        password=settings.postgres_password,
        host=settings.postgres_host,
        port=settings.postgres_port,
        database=settings.postgres_db,
    )


engine = create_engine(build_database_url())

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()
