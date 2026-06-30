from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentOut(BaseModel):
    id: int
    title: Optional[str]
    url: Optional[str]
    date: Optional[str]
    type: Optional[str]
    body: Optional[str]
    file_url: Optional[str]
    source: Optional[str]
    country: Optional[str]
    scraped_at: Optional[datetime]
    content_text: Optional[str] = None

    class Config:
        from_attributes = True
