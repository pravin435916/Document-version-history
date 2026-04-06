from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Document Version History"
    PORT: int = 8000
    CLIENT_ORIGIN: str = "http://localhost:5173"
    MONGO_URI: str
    DB_NAME: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()