from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import os
import uuid
from app.database import get_db
from app.models import DocumentOut

router = APIRouter()

@router.get("/documents/stats/countries")
def count_unique_countries(db: Session = Depends(get_db)):
    # Count distinct countries from UNFCCC, plus 1 for Kenya (from national data) if not already counted
    row = db.execute(text("SELECT COUNT(DISTINCT country) as count FROM documents WHERE source = 'UNFCCC' AND country != 'Africa (Global)'")).mappings().first()
    # Add 1 to ensure Kenya is counted (as national data covers it), unless it's already in the UNFCCC count.
    # A simplified approach: just count distinct countries from UNFCCC. It usually includes Kenya anyway.
    # To be perfectly accurate across the platform (excluding counties which are also stored in the 'country' column for KNBS):
    count = row["count"] if row else 0
    return {"count": count}

@router.get("/api/stats")
def get_global_stats(db: Session = Depends(get_db)):
    countries_row = db.execute(text("SELECT COUNT(DISTINCT country) as count FROM documents WHERE source = 'UNFCCC' AND country != 'Africa (Global)'")).mappings().first()
    countries_count = countries_row["count"] if countries_row else 0

    reports_row = db.execute(text("SELECT COUNT(*) as count FROM documents WHERE source IN ('UNFCCC', 'KNBS', 'World Bank', 'KMD')")).mappings().first()
    reports_count = reports_row["count"] if reports_row else 0

    field_row = db.execute(text("SELECT COUNT(*) as count FROM documents WHERE source = 'KOBO'")).mappings().first()
    field_count = field_row["count"] if field_row else 0

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
    limit: int = Query(20, le=1000),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    filters = []
    params = {"limit": limit, "offset": offset}

    if source:
        filters.append("source = :source")
        params["source"] = source
    if country:
        filters.append("country ILIKE :country")
        params["country"] = f"%{country}%"
    if type:
        filters.append("type ILIKE :type")
        params["type"] = f"%{type}%"

    where = ("WHERE " + " AND ".join(filters)) if filters else ""
    query = text(f"SELECT * FROM documents {where} ORDER BY scraped_at DESC LIMIT :limit OFFSET :offset")
    rows = db.execute(query, params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT * FROM documents WHERE id = :id"), {"id": doc_id}).mappings().first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(row)

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
