# create router for document
from typing import List

from fastapi import APIRouter, HTTPException, Header, Query

from app.core.db import db
from app.schemas.document import CreateDocument, UpdateDocument, DocumentResponse, HistoryResponse, DocumentListResponse
from app.services.document import (
    DocumentService,
    DocumentDuplicateTitleError,
    DocumentNoChangeError,
    DocumentNotFoundError,
    DocumentVersionNotFoundError,
    DocumentInvalidIdError,
)

router = APIRouter(prefix="/documents", tags=["documents"])


def _document_response(document) -> DocumentResponse:
    # Find the active version based on current_version, fallback to the latest version if not found
    active_version = next(
        (version for version in document.versions if version.version_number == document.current_version),
        document.versions[-1],
    )
    return DocumentResponse(
        id=str(document.id),
        title=document.title,
        current_version=document.current_version,
        content=active_version.content,
    )


@router.post("/", response_model=DocumentResponse)
def create_document(document_data: CreateDocument, user_id: str = Header(...)):
    service = DocumentService(db)
    try:
        document = service.create_document(document_data, user_id)
        return _document_response(document)
    except DocumentDuplicateTitleError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/", response_model=List[DocumentListResponse])
def list_documents(user_id: str = Header(...)):
    service = DocumentService(db)
    return service.list_documents_by_user(user_id)


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(document_id: str, update_data: UpdateDocument, user_id: str = Header(...)):
    service = DocumentService(db)
    try:
        document = service.update_document(document_id, update_data, user_id)
        return _document_response(document)
    except (DocumentNotFoundError, DocumentVersionNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DocumentNoChangeError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, user_id: str = Header(...)):
    service = DocumentService(db)
    try:
        document = service.get_document(document_id, user_id)
        return _document_response(document)
    except DocumentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{document_id}/history", response_model=List[HistoryResponse])
def get_document_history(document_id: str, user_id: str = Header(...)):
    service = DocumentService(db)
    try:
        return service.get_document_history(document_id, user_id)
    except DocumentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{document_id}/rollback", response_model=DocumentResponse)
def rollback_document(
    document_id: str,
    version_number: int = Query(..., ge=1),
    user_id: str = Header(...),
):
    service = DocumentService(db)
    try:
        document = service.rollback_document(document_id, version_number, user_id)
        return _document_response(document)
    except (DocumentNotFoundError, DocumentVersionNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))
