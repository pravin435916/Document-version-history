# create document 
from datetime import datetime
import re
from bson import ObjectId
from bson.errors import InvalidId

from app.models.document import Document, Version
from app.schemas.document import CreateDocument, UpdateDocument, HistoryResponse, DocumentListResponse

from app.core.db import db

collection = db["documents"]


class DocumentNotFoundError(Exception):
    pass


class DocumentDuplicateTitleError(Exception):
    pass


class DocumentNoChangeError(Exception):
    pass


class DocumentVersionNotFoundError(Exception):
    pass


class DocumentInvalidIdError(Exception):
    pass


class DocumentService:
    def __init__(self, db):
        self.db = db

    def _to_object_id(self, document_id: str) -> ObjectId:
        try:
            return ObjectId(document_id)
        except (InvalidId, TypeError):
            raise DocumentInvalidIdError("Invalid document id")

    def _normalize_document(self, document: dict) -> Document:
        document["_id"] = str(document["_id"])
        return Document(**document)

    def _ensure_owner(self, document: dict, user_id: str) -> None:
        if document.get("created_by") != user_id: # check if created_by field in document matches user_id
            raise DocumentNotFoundError("Document not found")

    def _get_active_version(self, document: dict):
        return next(
            (version for version in document["versions"] if version["version_number"] == document["current_version"]),
            document["versions"][-1], # -1 is the latest version in case current_version is not found
        )

    def create_document(self, document_data: CreateDocument, user_id: str) -> Document:
        normalized_title = document_data.title.strip()
        existing_document = self.db.documents.find_one(
            { 
                "title": {
                    "$regex": f"^{re.escape(normalized_title)}$",
                    "$options": "i",
                }
            }
        )
        if existing_document:
            raise DocumentDuplicateTitleError("Document title already exists")

        document_id = str(ObjectId())
        version = Version(
            version_number=1,
            content=document_data.content,
            created_at=datetime.utcnow(),
            edited_by=user_id
        )
        document = Document(
            id=document_id,
            title=normalized_title,
            current_version=1,
            versions=[version],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by=user_id
        )
        self.db.documents.insert_one(
            {
                "_id": ObjectId(document_id),
                "created_by": user_id,
                **document.dict(exclude={"id"}),
            }
        )
        return document

    def list_documents_by_user(self, user_id: str):
        documents = self.db.documents.find({"created_by": user_id}).sort("updated_at", -1)
        result = []
        for document in documents:
            active_version = self._get_active_version(document)
            result.append(
                DocumentListResponse(
                    id=str(document["_id"]),
                    title=document["title"],
                    current_version=document["current_version"],
                    content=active_version["content"],
                    updated_at=document["updated_at"],
                )
            )
        return result
    
    def update_document(self, document_id: str, update_data: UpdateDocument, user_id: str) -> Document:
        object_id = self._to_object_id(document_id)
        document = self.db.documents.find_one({"_id": object_id})
        if not document:
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id) 

        active_version = self._get_active_version(document)
        if active_version["content"] == update_data.content:
            raise DocumentNoChangeError("Warning: content is unchanged. New version was not created")
        
        current_version = document["current_version"] + 1
        version = Version(
            version_number=current_version,
            content=update_data.content,
            created_at=datetime.utcnow(),
            edited_by=user_id
        )
        self.db.documents.update_one(
            {"_id": object_id},
            {
                "$push": {"versions": version.dict()},
                "$set": {"current_version": current_version, "updated_at": datetime.utcnow()}
            }
        )
        document["current_version"] = current_version
        document["updated_at"] = datetime.utcnow()
        return self._normalize_document(document)
    
    def get_document(self, document_id: str, user_id: str) -> Document:
        object_id = self._to_object_id(document_id)
        document = self.db.documents.find_one({"_id": object_id})
        if not document:
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id)
        return self._normalize_document(document)
    
    def get_document_history(self, document_id: str, user_id: str):
        object_id = self._to_object_id(document_id)
        document = self.db.documents.find_one({"_id": object_id})
        if not document:
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id)
        return [
            HistoryResponse(
                version=version["version_number"],
                edited_by=version["edited_by"],
                created_at=version["created_at"],
                content=version["content"],
            )
            for version in document["versions"]
        ]
    
    # user id docid , ? query param for version number
    # switch to that version and make it current version
    # dont create any new version just switch to that version and make it current version
    def rollback_document(self, document_id: str, version_number: int, user_id: str) -> Document:
        object_id = self._to_object_id(document_id)
        document = self.db.documents.find_one({"_id": object_id})
        if not document:
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id)
        # find the version in document versions with version number
        version = next((v for v in document["versions"] if v["version_number"] == version_number), None)
        if not version:
            raise DocumentVersionNotFoundError("Version not found")
        
        self.db.documents.update_one(
            {"_id": object_id},
            {
                "$set": {"current_version": version_number, "updated_at": datetime.utcnow()}
            }
        )
        document["current_version"] = version_number
        document["updated_at"] = datetime.utcnow()
        return self._normalize_document(document)