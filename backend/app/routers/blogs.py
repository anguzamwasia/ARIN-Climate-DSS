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

from app.services.email_service import (
    send_submission_received_email,
    send_approval_email,
    send_revision_requested_email,
    send_published_updated_email
)

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
                send_submission_received_email(
                    to_email=author_email_clean,
                    author_name=blog.author_name,
                    title=blog.title,
                    post_type=blog.post_type
                )
                type_label = "Research Paper" if blog.post_type == "research" else "Community Story"
                db.execute(text("""
                    INSERT INTO notifications (user_email, title, message, is_read, created_at)
                    VALUES (:email, :title, :message, FALSE, :now)
                """), {
                    "email": author_email_clean,
                    "title": f"{type_label} Received",
                    "message": f"Your {type_label.lower()} '{blog.title}' has been received and is under review.",
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
        send_submission_received_email(
            to_email=author_email_clean,
            author_name=blog.author_name,
            title=blog.title,
            post_type=blog.post_type
        )
        type_label = "Research Paper" if blog.post_type == "research" else "Community Story"
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": author_email_clean,
            "title": f"{type_label} Received",
            "message": f"Your {type_label.lower()} '{blog.title}' has been received and is under review.",
            "now": datetime.utcnow()
        })
        db.commit()

    return {
        "message": "Blog draft saved" if new_status == "draft" else "Blog submitted for review",
        "id": new_id
    }

@router.put("/blogs/{blog_id}")
def update_blog(blog_id: int, blog: BlogIn, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT * FROM blogs WHERE id = :id"), {"id": blog_id}).mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog not found")

    # Duplication check: only check if the title actually changed
    current_title = (row.get('title') or '').strip().lower()
    new_title = (blog.title or '').strip().lower()
    if new_title and new_title != current_title:
        existing = db.execute(
            text("SELECT id, status, author_email FROM blogs WHERE LOWER(title) = :title AND id != :id"),
            {"title": new_title, "id": blog_id}
        ).mappings().first()
        if existing:
            existing_author = existing.get('author_email')
            existing_author_clean = existing_author.strip().lower() if existing_author else None
            current_author_clean = blog.author_email.strip().lower() if blog.author_email else None
            # Only block if it conflicts with another user's submission or another published blog
            if existing['status'] == 'approved' or (existing_author_clean != current_author_clean and existing['status'] != 'draft'):
                from fastapi import HTTPException
                raise HTTPException(status_code=400, detail="Another blog submission with this title already exists.")

    current_status = row.get('status')
    prev_version_str = row.get('previous_version')
    edited_flag = row.get('edited_by_admin') or False

    if blog.edited_by_admin:
        import json
        blog_data = {
            "title": row.get('title'),
            "author_name": row.get('author_name'),
            "summary": row.get('summary'),
            "background": row.get('background'),
            "findings": row.get('findings'),
            "implications": row.get('implications'),
            "narrative": row.get('narrative'),
            "impact": row.get('impact'),
            "sources": row.get('sources'),
            "image_url": row.get('image_url')
        }
        prev_version_str = json.dumps(blog_data)
        edited_flag = True

    # Determine status: if blog was already approved, keep it approved unless explicitly changed
    if blog.status and blog.status != 'pending':
        new_status = blog.status
    elif current_status == 'approved':
        new_status = 'approved'
    else:
        new_status = blog.status or current_status or 'pending'

    author_email_clean = (blog.author_email or row.get('author_email') or '').strip().lower() or None
    submitted_at_val = row.get('submitted_at') if current_status == 'approved' else datetime.utcnow()
    reviewed_at_val = datetime.utcnow() if new_status == 'approved' else row.get('reviewed_at')

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
            reviewed_at = :reviewed_at,
            author_email = :author_email,
            previous_version = :prev_version,
            edited_by_admin = :edited_by_admin
        WHERE id = :id
    """), {
        "title": blog.title,
        "author_name": blog.author_name,
        "post_type": blog.post_type,
        "summary": blog.summary,
        "background": blog.background,
        "findings": blog.findings,
        "implications": blog.implications,
        "narrative": blog.narrative,
        "impact": blog.impact,
        "sources": blog.sources,
        "image_url": blog.image_url,
        "status": new_status,
        "submitted_at": submitted_at_val,
        "reviewed_at": reviewed_at_val,
        "author_email": author_email_clean,
        "prev_version": prev_version_str,
        "edited_by_admin": edited_flag,
        "id": blog_id
    })
    db.commit()

    # If the blog is published and approved, refresh vector embeddings in ChromaDB immediately
    if new_status == 'approved':
        try:
            import chromadb
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection = chroma_client.get_or_create_collection(name="climate_docs")
            
            blog_text = f"{blog.summary or ''} {blog.background or ''} {blog.findings or ''} {blog.implications or ''} {blog.narrative or ''} {blog.impact or ''}"
            text_to_embed = f"Title: {blog.title}\nAuthor: {blog.author_name}\nType: User Blog\nContent: {blog_text[:3000]}"
            
            collection.upsert(
                documents=[text_to_embed],
                metadatas=[{
                    "title": blog.title or "Untitled Blog",
                    "source": "User Blog Submission",
                    "country": "Africa (Global)", 
                    "original_id": f"blog_{blog_id}"
                }],
                ids=[f"blog_{blog_id}"]
            )
        except Exception as e:
            print(f"Error embedding updated blog: {e}")

    # Notifications handling
    if current_status == 'approved' and new_status == 'approved':
        if author_email_clean:
            send_published_updated_email(
                to_email=author_email_clean,
                author_name=blog.author_name,
                title=blog.title,
                post_type=blog.post_type,
                blog_id=blog_id
            )
            type_label = "Research Paper" if blog.post_type == "research" else "Community Story"
            db.execute(text("""
                INSERT INTO notifications (user_email, title, message, is_read, created_at)
                VALUES (:email, :title, :message, FALSE, :now)
            """), {
                "email": author_email_clean,
                "title": f"Published {type_label} Updated ✍️",
                "message": f"Your published {type_label.lower()} '{blog.title}' was updated with editorial changes.",
                "now": datetime.utcnow()
            })
            db.commit()
        return {"message": "Published blog updated and live on platform", "id": blog_id, "status": new_status}

    if new_status != "draft" and author_email_clean:
        is_re_submission = row.get('status') == 'rejected'
        send_submission_received_email(
            to_email=author_email_clean,
            author_name=blog.author_name,
            title=blog.title,
            post_type=blog.post_type,
            is_resubmission=is_re_submission
        )
        type_label = "Research Paper" if blog.post_type == "research" else "Community Story"
        notif_title = f"{type_label} Revised" if is_re_submission else f"{type_label} Received"
        notif_msg = (
            f"Your corrected {type_label.lower()} '{blog.title}' has been resubmitted and is under review."
            if is_re_submission else
            f"Your {type_label.lower()} '{blog.title}' has been received and is under review."
        )

        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": author_email_clean,
            "title": notif_title,
            "message": notif_msg,
            "now": datetime.utcnow()
        })
        db.commit()

    return {"message": "Blog draft updated" if new_status == "draft" else "Blog updated and submitted for review", "id": blog_id, "status": new_status}


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
        author_email_clean = row['author_email'].strip().lower()
        post_type = row.get('post_type') or 'research'
        type_label = "Research Paper" if post_type == "research" else "Community Story"
        send_approval_email(
            to_email=author_email_clean,
            author_name=row['author_name'],
            title=row['title'],
            post_type=post_type,
            blog_id=blog_id,
            is_edited=is_edited
        )
        if is_edited:
            notif_title = "Approved with Edits ✍️"
            notif_msg = f"Your {type_label.lower()} '{row['title']}' has been approved with minor admin edits."
        else:
            notif_title = "Submission Approved 🎉"
            notif_msg = f"Your {type_label.lower()} '{row['title']}' has been approved and is now live!"

        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": author_email_clean,
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
        author_email_clean = row['author_email'].strip().lower()
        post_type = row.get('post_type') or 'research'
        type_label = "Research Paper" if post_type == "research" else "Community Story"
        send_revision_requested_email(
            to_email=author_email_clean,
            author_name=row['author_name'],
            title=row['title'],
            post_type=post_type,
            feedback=action.feedback or ''
        )
        db.execute(text("""
            INSERT INTO notifications (user_email, title, message, is_read, created_at)
            VALUES (:email, :title, :message, FALSE, :now)
        """), {
            "email": author_email_clean,
            "title": "Revision Requested ⚠️",
            "message": f"Your {type_label.lower()} '{row['title']}' requires revision. Feedback: {action.feedback}",
            "now": datetime.utcnow()
        })
        db.commit()

    return {"message": "Blog rejected"}

@router.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int, db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin)):
    db.execute(text("DELETE FROM blogs WHERE id = :id"), {"id": blog_id})
    db.commit()
    return {"message": "Blog deleted"}
