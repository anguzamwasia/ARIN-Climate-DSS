from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user
from app.database import get_db
from app.models.user import User

router = APIRouter()

@router.get("/notifications")
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Previously took `email` as a caller-supplied query param with no check
    # that it matched the caller -- anyone could read anyone else's
    # notifications. Now scoped to the authenticated user's own email.
    rows = db.execute(
        text("SELECT * FROM notifications WHERE user_email = :email ORDER BY created_at DESC"),
        {"email": current_user.email}
    ).mappings().all()
    return [dict(r) for r in rows]

@router.post("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = db.execute(
        text("UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_email = :email"),
        {"id": notif_id, "email": current_user.email}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}
