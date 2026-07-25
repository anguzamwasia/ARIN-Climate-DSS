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
    author_email: Optional[str] = None
    summary: Optional[str] = None
    background: Optional[str] = None
    findings: Optional[str] = None
    implications: Optional[str] = None
    narrative: Optional[str] = None
    impact: Optional[str] = None
    sources: Optional[str] = None
    image_url: Optional[str] = None

class BlogAction(BaseModel):
    feedback: Optional[str] = None

def send_simulated_email(to_email: str, subject: str, body: str):
    print(f"\n==================================================")
    print(f"[EMAIL SIMULATOR] Sending email to: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body:\n{body}")
    print(f"==================================================\n")

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
        INSERT INTO blogs (title, author_name, post_type, summary, background, findings, implications, narrative, impact, sources, image_url, status, submitted_at, author_email)
        VALUES (:title, :author_name, :post_type, :summary, :background, :findings, :implications, :narrative, :impact, :sources, :image_url, 'pending', :submitted_at, :author_email)
    """), {**blog.dict(), "submitted_at": datetime.utcnow()})
    db.commit()

    if blog.author_email:
        send_simulated_email(
            to_email=blog.author_email,
            subject="Climate Submission Received",
            body=f"Hello {blog.author_name},\n\nYour submission '{blog.title}' has been successfully received and is currently under review."
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": blog.author_email,
            "title": "Submission Received",
            "message": f"Your work '{blog.title}' has been received and is under review.",
            "now": datetime.utcnow()
        })
        db.commit()

    return {"message": "Blog submitted for review"}

@router.put("/blogs/{blog_id}")
def update_blog(blog_id: int, blog: BlogIn, db: Session = Depends(get_db)):
    db.execute(text("""
        UPDATE blogs 
        SET title = :title, 
            author_name = :author_name, 
            post_type = :post_type, 
            summary = :summary, 
            background = :background, 
            findings = :findings, 
            implications = :implications, 
            narrative = :narrative, 
            impact = :impact, 
            sources = :sources, 
            image_url = :image_url, 
            status = 'pending',
            submitted_at = :submitted_at,
            author_email = :author_email
        WHERE id = :id
    """), {**blog.dict(), "submitted_at": datetime.utcnow(), "id": blog_id})
    db.commit()

    if blog.author_email:
        send_simulated_email(
            to_email=blog.author_email,
            subject="Climate Submission Resubmitted",
            body=f"Hello {blog.author_name},\n\nYour revised submission '{blog.title}' has been successfully received and is currently under review."
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": blog.author_email,
            "title": "Submission Revised",
            "message": f"Your corrected work '{blog.title}' has been resubmitted and is under review.",
            "now": datetime.utcnow()
        })
        db.commit()

    return {"message": "Blog updated and submitted for review"}

@router.patch("/blogs/{blog_id}/approve")
def approve_blog(blog_id: int, db: Session = Depends(get_db)):
    db.execute(text("UPDATE blogs SET status = 'approved', reviewed_at = :now WHERE id = :id"), {"now": datetime.utcnow(), "id": blog_id})
    db.commit()
    
    row = db.execute(text("SELECT * FROM blogs WHERE id = :id"), {"id": blog_id}).mappings().first()
    if row and row.get('author_email'):
        send_simulated_email(
            to_email=row['author_email'],
            subject="Climate Submission Approved",
            body=f"Hello {row['author_name']},\n\nCongratulations! Your submission '{row['title']}' has been approved and is now live on the ARIN Climate DSS platform."
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": row['author_email'],
            "title": "Submission Approved 🎉",
            "message": f"Your work '{row['title']}' has been approved and is now live!",
            "now": datetime.utcnow()
        })
        db.commit()

    try:
        if row:
            import chromadb
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection = chroma_client.get_or_create_collection(name="climate_docs")
            
            blog_text = f"{row.get('summary', '')} {row.get('background', '')} {row.get('findings', '')} {row.get('implications', '')} {row.get('narrative', '')} {row.get('impact', '')}"
            text_to_embed = f"Title: {row.get('title')}\nAuthor: {row.get('author_name')}\nType: User Blog\nContent: {blog_text[:3000]}"
            
            collection.upsert(
                documents=[text_to_embed],
                metadatas=[{
                    "title": row.get('title') or "Untitled Blog",
                    "source": "User Blog Submission",
                    "country": "Africa (Global)", 
                    "original_id": f"blog_{blog_id}"
                }],
                ids=[f"blog_{blog_id}"]
            )
    except Exception as e:
        print(f"Error embedding blog: {e}")
        
    return {"message": "Blog approved and added to AI Knowledge Base"}

@router.patch("/blogs/{blog_id}/reject")
def reject_blog(blog_id: int, action: BlogAction, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT * FROM blogs WHERE id = :id"), {"id": blog_id}).mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog not found")

    import json
    blog_data = {
        "title": row.get('title'),
        "summary": row.get('summary'),
        "background": row.get('background'),
        "findings": row.get('findings'),
        "implications": row.get('implications'),
        "narrative": row.get('narrative'),
        "impact": row.get('impact'),
        "sources": row.get('sources')
    }
    prev_version_str = json.dumps(blog_data)

    db.execute(text("""
        UPDATE blogs 
        SET status = 'rejected', 
            reviewed_at = :now, 
            feedback = :feedback,
            previous_version = :prev_version
        WHERE id = :id
    """), {
        "now": datetime.utcnow(), 
        "feedback": action.feedback, 
        "prev_version": prev_version_str,
        "id": blog_id
    })
    db.commit()

    if row.get('author_email'):
        send_simulated_email(
            to_email=row['author_email'],
            subject="Revision Requested for Submission",
            body=f"Hello {row['author_name']},\n\nYour submission '{row['title']}' requires revision before it can be approved.\n\nAdmin Feedback:\n{action.feedback}\n\nPlease log in to your dashboard to edit and resubmit your work."
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": row['author_email'],
            "title": "Revision Requested ⚠️",
            "message": f"Your work '{row['title']}' requires revision. Feedback: {action.feedback}",
            "now": datetime.utcnow()
        })
        db.commit()

    return {"message": "Blog rejected"}

@router.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM blogs WHERE id = :id"), {"id": blog_id})
    db.commit()
    return {"message": "Blog deleted"}
