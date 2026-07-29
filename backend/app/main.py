import os
from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from app.config import settings, get_allowed_origins
from app.scheduler import run_scrapers

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # RUN_SCHEDULER=false lets you run multiple API workers (e.g.
    # `--workers 4`) without each worker firing its own copy of the scraper /
    # Kobo-sync jobs. Run exactly one process with RUN_SCHEDULER=true (or the
    # default single-worker dev setup) to own scheduling.
    if settings.RUN_SCHEDULER:
        # Schedule scrapers to run twice a week (Monday and Thursday at 2 AM)
        scheduler.add_job(run_scrapers, 'cron', day_of_week='mon,thu', hour=2, minute=0)

        # Schedule Kobo sync to run immediately and every 15 minutes
        try:
            from kobo_sync import sync_kobo
            scheduler.add_job(sync_kobo, 'date') # Run once on startup
            scheduler.add_job(sync_kobo, 'interval', minutes=15)
            print("Scheduler: KoboToolbox sync registered successfully.")
        except Exception as e:
            print(f"Scheduler Warning: Failed to register KoboToolbox sync: {e}")

        scheduler.start()
    else:
        print("Scheduler: RUN_SCHEDULER=false, skipping in this process.")

    yield

    if settings.RUN_SCHEDULER:
        scheduler.shutdown()

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import health, documents, chat, blogs, transcription, contact, auth, notifications, analytics
from app.database import engine
from app.models.user import Base
from app.models.blog import Blog
from app.models.notification import Notification

from sqlalchemy import text
Base.metadata.create_all(bind=engine)

# Auto-migration hook for schema column updates
try:
    with engine.begin() as conn:
        # Create notifications table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255),
                title VARCHAR(255),
                message TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            )
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_notifications_user_email ON notifications (user_email)"))

        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='blogs'"))
        columns = [r[0] for r in res.fetchall()]
        if 'author_email' not in columns:
            conn.execute(text("ALTER TABLE blogs ADD COLUMN author_email VARCHAR(255)"))
            print("Migration: Added author_email to blogs table.")
        if 'previous_version' not in columns:
            conn.execute(text("ALTER TABLE blogs ADD COLUMN previous_version TEXT"))
            print("Migration: Added previous_version to blogs table.")
        if 'edited_by_admin' not in columns:
            conn.execute(text("ALTER TABLE blogs ADD COLUMN edited_by_admin BOOLEAN DEFAULT FALSE"))
            print("Migration: Added edited_by_admin to blogs table.")

        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
        user_columns = [r[0] for r in res.fetchall()]
        if 'role' not in user_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'"))
            # Promote the whitelisted admin email(s) so require_admin has at least one real admin.
            conn.execute(text("UPDATE users SET role = 'admin' WHERE email = 'admin@arin-africa.org'"))
            print("Migration: Added role to users table.")
except Exception as e:
    print(f"Auto-schema upgrade warning: {e}")

app = FastAPI(
    title="ARIN Climate DSS API",
    description="AI-Driven Climate Data Processing Pipeline — Africa Research and Impact Network",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
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
app.include_router(notifications.router, tags=["Notifications"])
app.include_router(analytics.router, tags=["Analytics"])
