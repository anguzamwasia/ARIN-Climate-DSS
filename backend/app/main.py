from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, documents, chat

app = FastAPI(
    title="ARIN Climate DSS API",
    description="AI-Driven Climate Data Processing Pipeline — Africa Research and Impact Network",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(chat.router, tags=["Chat"])
