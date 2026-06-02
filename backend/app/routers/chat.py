from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # RAG pipeline wires in here during Weeks 5-6
    return ChatResponse(
        answer=f"[RAG STUB] You asked: '{request.question}'. The full AI pipeline will be connected in Week 5.",
        sources=[]
    )
