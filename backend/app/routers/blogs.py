from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database import get_db

router = APIRouter()

class BlogIn(BaseModel):
    title: str
    author_name: str
    post_type: str
    summary: Optional[str] = None
    findings: Optional[str] = None
    narrative: Optional[str] = None
    impact: Optional[str] = None
    sources: Optional[str] = None
    image_url: Optional[str] = None

class BlogAction(BaseModel):
    feedback: Optional[str] = None

@router.get("/blogs")
def list_blogs(status: Optional[str] = None, db: Session = Depends(get_db)):
    if status:
        rows = db.execute(text("SELECT * FROM blogs WHERE status = :status ORDER BY submitted_at DESC"), {"status": status}).mappings().all()
    else:
        rows = db.execute(text("SELECT * FROM blogs ORDER BY submitted_at DESC")).mappings().all()
    return [dict(r) for r in rows]

@router.get("/blogs/{blog_id}")
def get_blog(blog_id: int, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT * FROM blogs WHERE id = :id"), {"id": blog_id}).mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog not found")
    return dict(row)

@router.post("/blogs")
def submit_blog(blog: BlogIn, db: Session = Depends(get_db)):
    db.execute(text("""
        INSERT INTO blogs (title, author_name, post_type, summary, findings, narrative, impact, sources, image_url, status, submitted_at)
        VALUES (:title, :author_name, :post_type, :summary, :findings, :narrative, :impact, :sources, :image_url, 'pending', :submitted_at)
    """), {**blog.dict(), "submitted_at": datetime.utcnow()})
    db.commit()
    return {"message": "Blog submitted for review"}

@router.patch("/blogs/{blog_id}/approve")
def approve_blog(blog_id: int, db: Session = Depends(get_db)):
    db.execute(text("UPDATE blogs SET status = 'approved', reviewed_at = :now WHERE id = :id"), {"now": datetime.utcnow(), "id": blog_id})
    db.commit()
    return {"message": "Blog approved"}

@router.patch("/blogs/{blog_id}/reject")
def reject_blog(blog_id: int, action: BlogAction, db: Session = Depends(get_db)):
    db.execute(text("UPDATE blogs SET status = 'rejected', reviewed_at = :now, feedback = :feedback WHERE id = :id"),
               {"now": datetime.utcnow(), "feedback": action.feedback, "id": blog_id})
    db.commit()
    return {"message": "Blog rejected"}

@router.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM blogs WHERE id = :id"), {"id": blog_id})
    db.commit()
    return {"message": "Blog deleted"}
