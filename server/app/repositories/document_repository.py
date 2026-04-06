from typing import Optional

from bson import ObjectId


class DocumentRepository:
    def __init__(self, db):
        self.collection = db["documents"]

    def find_one_by_title_case_insensitive(self, title_regex: str) -> Optional[dict]:
        return self.collection.find_one({"title": {"$regex": title_regex, "$options": "i"}})

    def insert_one(self, payload: dict) -> None:
        self.collection.insert_one(payload)

    def find_by_id(self, object_id: ObjectId) -> Optional[dict]:
        return self.collection.find_one({"_id": object_id})

    def find_by_owner(self, user_id: str):
        return self.collection.find({"created_by": user_id}).sort("updated_at", -1)

    def push_version_and_set_current(self, object_id: ObjectId, version_payload: dict, current_version: int, updated_at):
        self.collection.update_one(
            {"_id": object_id},
            {
                "$push": {"versions": version_payload},
                "$set": {"current_version": current_version, "updated_at": updated_at},
            },
        )

    def set_current_version(self, object_id: ObjectId, current_version: int, updated_at):
        self.collection.update_one(
            {"_id": object_id},
            {
                "$set": {"current_version": current_version, "updated_at": updated_at},
            },
        )
