from pydantic import BaseModel, Field
from typing import List, Any, Optional
from datetime import datetime


class Version(BaseModel):
    version_number: int
    content: Any #  Json content of the document
    edited_by: str
    created_at: datetime

class Document(BaseModel):
    id: Optional[str] = Field(None, alias="_id")  
    title: str = Field(..., max_length=100) 
    current_version: int
    versions: List[Version]
    created_at: datetime
    updated_at: datetime
    created_by: str

    class Config:
        populate_by_name = True