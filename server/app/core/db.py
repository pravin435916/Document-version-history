# connect db
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db: AsyncIOMotorDatabase = client[settings.DB_NAME]