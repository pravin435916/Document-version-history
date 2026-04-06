# connect db 
from pymongo import MongoClient
from app.core.config import settings

client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

# Connection pool -> explore and how it works

# Repository layer -> DRY , solid principles