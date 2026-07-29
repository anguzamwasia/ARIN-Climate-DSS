from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

class FeedbackRequest(BaseModel):
    question: str
    response: str
    rating: int
