import os
from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from app.scheduler import run_scrapers

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schedule scrapers to run twice a week (Monday and Thursday at 2 AM)
    scheduler.add_job(run_scrapers, 'cron', day_of_week='mon,thu', hour=2, minute=0)
    scheduler.start()
    yield
    scheduler.shutdown()

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import health, documents, chat, blogs, transcription, contact, auth
from app.database import engine
from app.models.user import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ARIN Climate DSS API",
    description="AI-Driven Climate Data Processing Pipeline — Africa Research and Impact Network",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(health.router, tags=["Health"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(blogs.router, tags=["Blogs"])
app.include_router(transcription.router, tags=["Transcription"])
app.include_router(contact.router, tags=["Contact"])
app.include_router(auth.router, tags=["Auth"])
