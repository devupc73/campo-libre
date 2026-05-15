from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = 'Campo Libre API'
    database_url: str = 'postgresql://campo:campo@localhost:5432/campo_libre'
    jwt_secret: str = 'change-me'
    jwt_algorithm: str = 'HS256'

    class Config:
        env_file = '.env'


settings = Settings()
