# create schema for document
from datetime import datetime

from pydantic import BaseModel

class CreateDocument(BaseModel):
    title: str
    content: str

class UpdateDocument(BaseModel):
    content: str


class DocumentResponse(BaseModel):
    id: str
    title: str
    current_version: int
    content: str


class DocumentListResponse(BaseModel):
    id: str
    title: str
    current_version: int
    content: str
    updated_at: datetime

class HistoryResponse(BaseModel):
    version: int
    edited_by: str
    created_at: datetime
    content: str



