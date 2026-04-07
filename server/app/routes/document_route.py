# create router for document
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.db import db
from app.dependencies.auth import get_current_user
from app.repositories.document_repository import DocumentRepository
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
async def create_document(document_data: CreateDocument, current_user: dict = Depends(get_current_user)):
    service = DocumentService(DocumentRepository(db))
    try:
        document = await service.create_document(document_data, str(current_user["_id"]))
        return _document_response(document)
    except DocumentDuplicateTitleError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/", response_model=List[DocumentListResponse])
async def list_documents(current_user: dict = Depends(get_current_user)):
    service = DocumentService(DocumentRepository(db))
    return await service.list_documents_by_user(str(current_user["_id"]))


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(document_id: str, update_data: UpdateDocument, current_user: dict = Depends(get_current_user)):
    service = DocumentService(DocumentRepository(db))
    try:
        document = await service.update_document(document_id, update_data, str(current_user["_id"]))
        return _document_response(document)
    except (DocumentNotFoundError, DocumentVersionNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DocumentNoChangeError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, current_user: dict = Depends(get_current_user)):
    service = DocumentService(DocumentRepository(db))
    try:
        document = await service.get_document(document_id, str(current_user["_id"]))
        return _document_response(document)
    except DocumentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{document_id}/history", response_model=List[HistoryResponse])
async def get_document_history(document_id: str, current_user: dict = Depends(get_current_user)):
    service = DocumentService(DocumentRepository(db))
    try:
        return await service.get_document_history(document_id, str(current_user["_id"]))
    except DocumentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{document_id}/rollback", response_model=DocumentResponse)
async def rollback_document(
    document_id: str,
    version_number: int = Query(..., ge=1),
    current_user: dict = Depends(get_current_user),
):
    service = DocumentService(DocumentRepository(db))
    try:
        document = await service.rollback_document(document_id, version_number, str(current_user["_id"]))
        return _document_response(document)
    except (DocumentNotFoundError, DocumentVersionNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DocumentInvalidIdError as e:
        raise HTTPException(status_code=400, detail=str(e))
