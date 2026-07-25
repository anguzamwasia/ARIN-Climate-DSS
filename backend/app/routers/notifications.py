from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db

router = APIRouter()

@router.get("/notifications")
def list_notifications(email: str, db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT * FROM notifications WHERE user_email = :email ORDER BY created_at DESC"),
        {"email": email}
    ).mappings().all()
    return [dict(r) for r in rows]

@router.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE notifications SET is_read = TRUE WHERE id = :id"),
        {"id": notif_id}
    ).mappings()
    db.commit()
    return {"message": "Notification marked as read"}
