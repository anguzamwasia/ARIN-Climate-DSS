from fastapi import APIRouter, Depends
from app.auth import get_current_admin
from app.models.user import User
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
    edited_by_admin: Optional[bool] = None
    status: Optional[str] = 'pending'

class BlogAction(BaseModel):
    feedback: Optional[str] = None

def send_simulated_email(to_email: str, subject: str, body: str):
    print(f"\n==================================================")
    print(f"[EMAIL SIMULATOR] Sending email to: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body:\n{body}")
    print(f"==================================================\n")

@router.get("/blogs")
def list_blogs(status: Optional[str] = None, author_email: Optional[str] = None, db: Session = Depends(get_db)):
    query = "SELECT * FROM blogs"
    conditions = []
    params = {}
    if status:
        conditions.append("status = :status")
        params["status"] = status
    if author_email:
        conditions.append("LOWER(author_email) = :author_email")
        params["author_email"] = author_email.strip().lower()

    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY submitted_at DESC"
    rows = db.execute(text(query), params).mappings().all()
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
    new_status = blog.status or 'pending'
    author_email_clean = blog.author_email.strip().lower() if blog.author_email else None

    # Duplication check
    existing = db.execute(text("SELECT id, status, author_email FROM blogs WHERE title = :title"), {"title": blog.title}).mappings().first()
    if existing:
        existing_author = existing.get('author_email')
        existing_author_clean = existing_author.strip().lower() if existing_author else None
        
        # If the existing record is a draft by the same author, update it directly rather than failing
        if existing['status'] == 'draft' and author_email_clean and existing_author_clean == author_email_clean:
            existing_id = existing['id']
            db.execute(text("""
                UPDATE blogs 
                SET title = :title, author_name = :author_name, post_type = :post_type, 
                    summary = :summary, background = :background, findings = :findings, 
                    implications = :implications, narrative = :narrative, impact = :impact, 
                    sources = :sources, image_url = :image_url, status = :status, 
                    submitted_at = :submitted_at, author_email = :author_email
                WHERE id = :id
            """), {
                **blog.dict(exclude={'edited_by_admin', 'status'}),
                "status": new_status,
                "submitted_at": datetime.utcnow(),
                "author_email": author_email_clean,
                "id": existing_id
            })
            db.commit()
            
            if new_status != "draft" and author_email_clean:
                send_simulated_email(
                    to_email=author_email_clean,
                    subject="Climate Submission Received",
                    body=f"Hello {blog.author_name},\n\nYour submission '{blog.title}' has been successfully received and is currently under review."
                )
                db.execute(text("""
                    INSERT INTO notifications (user_email, title, message, is_read, created_at)
                    VALUES (:email, :title, :message, FALSE, :now)
                """), {
                    "email": author_email_clean,
                    "title": "Submission Received",
                    "message": f"Your work '{blog.title}' has been received and is under review.",
                    "now": datetime.utcnow()
                })
                db.commit()

            return {
                "message": "Blog draft saved" if new_status == "draft" else "Blog submitted for review",
                "id": existing_id
            }
        else:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="A blog submission with this title already exists.")

    res = db.execute(text("""
        INSERT INTO blogs (title, author_name, post_type, summary, background, findings, implications, narrative, impact, sources, image_url, status, submitted_at, author_email, edited_by_admin)
        VALUES (:title, :author_name, :post_type, :summary, :background, :findings, :implications, :narrative, :impact, :sources, :image_url, :status, :submitted_at, :author_email, FALSE)
        RETURNING id
    """), {
        **blog.dict(exclude={'edited_by_admin', 'status'}),
        "status": new_status,
        "submitted_at": datetime.utcnow(),
        "author_email": author_email_clean
    })
    new_id = res.fetchone()[0]
    db.commit()

    if new_status != "draft" and author_email_clean:
        send_simulated_email(
            to_email=author_email_clean,
            subject="Climate Submission Received",
            body=f"Hello {blog.author_name},\n\nYour submission '{blog.title}' has been successfully received and is currently under review."
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": author_email_clean,
            "title": "Submission Received",
            "message": f"Your work '{blog.title}' has been received and is under review.",
            "now": datetime.utcnow()
        })
        db.commit()

    return {
        "message": "Blog draft saved" if new_status == "draft" else "Blog submitted for review",
        "id": new_id
    }

@router.put("/blogs/{blog_id}")
def update_blog(blog_id: int, blog: BlogIn, db: Session = Depends(get_db)):
    # Duplication check (ignore self)
    existing = db.execute(text("SELECT id, status, author_email FROM blogs WHERE title = :title AND id != :id"), {"title": blog.title, "id": blog_id}).mappings().first()
    if existing:
        existing_author = existing.get('author_email')
        existing_author_clean = existing_author.strip().lower() if existing_author else None
        current_author_clean = blog.author_email.strip().lower() if blog.author_email else None
        # Only block if it conflicts with another user or an active submission
        if existing['status'] != 'draft' or existing_author_clean != current_author_clean:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Another blog submission with this title already exists.")

    row = db.execute(text("SELECT * FROM blogs WHERE id = :id"), {"id": blog_id}).mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog not found")

    prev_version_str = row.get('previous_version')
    edited_flag = row.get('edited_by_admin') or False

    if blog.edited_by_admin:
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
        edited_flag = True

    new_status = blog.status or 'pending'

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
            status = :status,
            submitted_at = :submitted_at,
            author_email = :author_email,
            previous_version = :prev_version,
            edited_by_admin = :edited_by_admin
        WHERE id = :id
    """), {
        **blog.dict(exclude={'edited_by_admin', 'status'}),
        "status": new_status,
        "submitted_at": datetime.utcnow(),
        "id": blog_id,
        "prev_version": prev_version_str,
        "edited_by_admin": edited_flag
    })
    db.commit()

    if new_status != "draft" and blog.author_email:
        is_re_submission = row.get('status') == 'rejected'
        subject = "Climate Submission Resubmitted" if is_re_submission else "Climate Submission Received"
        body_text = (
            f"Hello {blog.author_name},\n\nYour revised submission '{blog.title}' has been successfully received and is currently under review."
            if is_re_submission else
            f"Hello {blog.author_name},\n\nYour submission '{blog.title}' has been successfully received and is currently under review."
        )
        notif_title = "Submission Revised" if is_re_submission else "Submission Received"
        notif_msg = (
            f"Your corrected work '{blog.title}' has been resubmitted and is under review."
            if is_re_submission else
            f"Your work '{blog.title}' has been received and is under review."
        )

        send_simulated_email(
            to_email=blog.author_email,
            subject=subject,
            body=body_text
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": blog.author_email,
            "title": notif_title,
            "message": notif_msg,
            "now": datetime.utcnow()
        })
        db.commit()

    return {"message": "Blog draft updated" if new_status == "draft" else "Blog updated and submitted for review"}

@router.patch("/blogs/{blog_id}/approve")
def approve_blog(blog_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin)):
    row = db.execute(text("SELECT * FROM blogs WHERE id = :id"), {"id": blog_id}).mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog not found")

    is_edited = row.get('edited_by_admin') or False
    
    db.execute(text("UPDATE blogs SET status = 'approved', reviewed_at = :now WHERE id = :id"), {"now": datetime.utcnow(), "id": blog_id})
    db.commit()
    
    if row.get('author_email'):
        if is_edited:
            subject = "Climate Submission Approved with Edits"
            body = (
                f"Hello {row['author_name']},\n\n"
                f"Your submission '{row['title']}' has been approved and published with minor edits by the administrator.\n\n"
                f"Please log in to your dashboard to compare your original version with the published version so you can learn from the adjustments."
            )
            notif_title = "Approved with Edits ✍️"
            notif_msg = f"Your work '{row['title']}' has been approved with minor admin edits. Click to view comparison!"
        else:
            subject = "Climate Submission Approved"
            body = f"Hello {row['author_name']},\n\nCongratulations! Your submission '{row['title']}' has been approved and is now live on the ARIN Climate DSS platform."
            notif_title = "Submission Approved 🎉"
            notif_msg = f"Your work '{row['title']}' has been approved and is now live!"
            
        send_simulated_email(to_email=row['author_email'], subject=subject, body=body)
        
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": row['author_email'],
            "title": notif_title,
            "message": notif_msg,
            "now": datetime.utcnow()
        })
        db.commit()

    try:
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
def reject_blog(blog_id: int, action: BlogAction, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin)):
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
def delete_blog(blog_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin)):
    db.execute(text("DELETE FROM blogs WHERE id = :id"), {"id": blog_id})
    db.commit()
    return {"message": "Blog deleted"}
