from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import os
import uuid
from app.database import get_db
from app.schemas.document import DocumentOut
from app.models.document import Document

router = APIRouter()

@router.get("/documents/stats/countries")
def count_unique_countries(db: Session = Depends(get_db)):
    count = db.query(func.count(func.distinct(Document.country)))\
        .filter(Document.source == 'UNFCCC', Document.country != 'Africa (Global)')\
        .scalar() or 0
    return {"count": count}

@router.get("/api/stats")
def get_global_stats(db: Session = Depends(get_db)):
    countries_count = db.query(func.count(func.distinct(Document.country)))\
        .filter(Document.source == 'UNFCCC', Document.country != 'Africa (Global)')\
        .scalar() or 0

    reports_count = db.query(func.count(Document.id))\
        .filter(Document.source.in_(['UNFCCC', 'KNBS', 'World Bank', 'KMD']))\
        .scalar() or 0

    field_count = db.query(func.count(Document.id))\
        .filter(Document.source == 'KOBO')\
        .scalar() or 0

    return {
        "stats": [
            {
                "icon": "globe",
                "value": countries_count,
                "suffix": "+",
                "label": "African Countries",
                "description": "Research coverage"
            },
            {
                "icon": "fileText",
                "value": reports_count,
                "suffix": "+",
                "label": "Policy Reports",
                "description": "UNFCCC & National"
            },
            {
                "icon": "users",
                "value": field_count,
                "suffix": "+",
                "label": "Field Submissions",
                "description": "KoboCollect data"
            }
        ]
    }

@router.get("/documents", response_model=list[DocumentOut])
def list_documents(
    source: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(20, le=10000),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if source:
        query = query.filter(Document.source == source)
    if country:
        query = query.filter(Document.country.ilike(f"%{country}%"))
    if type:
        query = query.filter(Document.type.ilike(f"%{type}%"))

    return query.order_by(Document.scraped_at.desc()).offset(offset).limit(limit).all()

@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("/api/v1/admin/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    # Define acceptable research paper formats
    allowed_extensions = {".pdf", ".docx", ".csv", ".xlsx"}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file format {ext}. Allowed: pdf, docx, csv, xlsx")

    # Secure storage directory
    upload_dir = "uploads/documents"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename to prevent collisions
    safe_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Returning success response. 
        # (In a fully implemented system, you would parse the file here and insert into ChromaDB / PostgreSQL)
        return {
            "status": "success",
            "message": "File uploaded and stored securely.",
            "original_name": file.filename,
            "saved_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
