from datetime import datetime
from typing import Optional

from bson import ObjectId

from app.models.user import User


class UserRepository:
    def __init__(self, db):
        self.collection = db["users"]

    def find_by_username(self, username: str) -> Optional[dict]:
        return self.collection.find_one({"username": username})

    def find_by_id(self, user_id: str) -> Optional[dict]:
        return self.collection.find_one({"_id": ObjectId(user_id)})

    def create_user(self, username: str, password_hash: str) -> User:
        user_id = ObjectId()
        payload = {
            "_id": user_id,
            "username": username,
            "password_hash": password_hash,
            "created_at": datetime.utcnow(),
        }
        self.collection.insert_one(payload)
        payload["_id"] = str(payload["_id"])
        return User(**payload)
