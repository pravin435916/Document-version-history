from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    password_hash: str
    created_at: datetime

    class Config:
        populate_by_name = True
