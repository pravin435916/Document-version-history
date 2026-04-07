# create document 
from datetime import datetime
import re
from bson import ObjectId
from bson.errors import InvalidId

from app.models.document import Document, Version
from app.schemas.document import CreateDocument, UpdateDocument, HistoryResponse, DocumentListResponse
from app.repositories.document_repository import DocumentRepository

import logging
logger = logging.getLogger(__name__)

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
    def __init__(self, repository: DocumentRepository):
        self.repository = repository

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

    async def create_document(self, document_data: CreateDocument, user_id: str) -> Document:
        normalized_title = document_data.title.strip()
        existing_document = await self.repository.find_one_by_title_case_insensitive(
            f"^{re.escape(normalized_title)}$"
        )
        if existing_document:
            logger.warning("Document title already exists")
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
        await self.repository.insert_one(
            {
                "_id": ObjectId(document_id),
                "created_by": user_id,
                **document.dict(exclude={"id"}),
            }
        )
        logger.info("Document %s created by user %s", document_id, user_id)
        return document

    async def list_documents_by_user(self, user_id: str):
        documents = await self.repository.find_by_owner(user_id)
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
    
    async def update_document(self, document_id: str, update_data: UpdateDocument, user_id: str) -> Document:
        object_id = self._to_object_id(document_id)
        document = await self.repository.find_by_id(object_id)
        if not document:
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id) 

        active_version = self._get_active_version(document)
        if active_version["content"] == update_data.content:
            logger.warning("Document content is unchanged. No new version created.")
            raise DocumentNoChangeError("Warning: content is unchanged. New version was not created")
        
        current_version = document["current_version"] + 1
        version = Version(
            version_number=current_version,
            content=update_data.content,
            created_at=datetime.utcnow(),
            edited_by=user_id
        )
        updated_at = datetime.utcnow()
        await self.repository.push_version_and_set_current(
            object_id,
            version.dict(),
            current_version,
            updated_at,
        )
        logger.info("Document %s updated to version %s by user %s", document_id, current_version, user_id)
        document["current_version"] = current_version
        document["updated_at"] = updated_at
        return self._normalize_document(document)
    
    async def get_document(self, document_id: str, user_id: str) -> Document:
        object_id = self._to_object_id(document_id)
        document = await self.repository.find_by_id(object_id)
        if not document:
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id)
        return self._normalize_document(document)
    
    async def get_document_history(self, document_id: str, user_id: str):
        object_id = self._to_object_id(document_id)
        document = await self.repository.find_by_id(object_id)
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
    async def rollback_document(self, document_id: str, version_number: int, user_id: str) -> Document:
        object_id = self._to_object_id(document_id)
        document = await self.repository.find_by_id(object_id)
        if not document:
            logger.warning("Document with id %s not found for rollback", document_id)
            raise DocumentNotFoundError("Document not found")
        self._ensure_owner(document, user_id)
        # find the version in document versions with version number
        version = next((v for v in document["versions"] if v["version_number"] == version_number), None)
        if not version:
            logger.warning("Version number %s not found for document %s", version_number, document_id)
            raise DocumentVersionNotFoundError("Version not found")
        
        updated_at = datetime.utcnow()
        await self.repository.set_current_version(object_id, version_number, updated_at)
        logger.info("Document %s rolled back to version %s by user %s", document_id, version_number, user_id)
        document["current_version"] = version_number
        document["updated_at"] = updated_at
        return self._normalize_document(document)