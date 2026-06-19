from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db

router = APIRouter()

class ContactIn(BaseModel):
    name: str
    email: str
    message: str

@router.post("/api/v1/public/contact")
def submit_contact(contact: ContactIn, db: Session = Depends(get_db)):
    # Ensure the contacts table exists
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT,
            message TEXT,
            submitted_at TIMESTAMP
        )
    """))
    # Save the contact message
    db.execute(text("""
        INSERT INTO contacts (name, email, message, submitted_at)
        VALUES (:name, :email, :message, :submitted_at)
    """), {"name": contact.name, "email": contact.email, "message": contact.message, "submitted_at": datetime.utcnow()})
    db.commit()
    return {"status": "success", "message": "Contact form submitted"}
