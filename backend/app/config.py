from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = 'Campo Libre API'
    database_url: str | None = None
    postgres_host: str = 'localhost'
    postgres_port: int = 5432
    postgres_db: str = 'campo_libre'
    postgres_user: str = 'campo'
    postgres_password: str = 'campo'
    jwt_secret: str = 'change-me'
    jwt_algorithm: str = 'HS256'

    class Config:
        env_file = '.env'


settings = Settings()
