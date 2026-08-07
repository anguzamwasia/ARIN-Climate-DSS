from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

class FeedbackRequest(BaseModel):
    question: str
    response: str
    rating: int

class ChatThreadCreate(BaseModel):
    title: str

class ChatThreadOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatMessageOut(BaseModel):
    id: int
    thread_id: str
    role: str
    content: str
    sources: Optional[List[Any]] = None
    rating: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
