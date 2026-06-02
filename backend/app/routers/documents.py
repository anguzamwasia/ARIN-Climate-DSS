from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from app.database import get_db
from app.models import DocumentOut

router = APIRouter()

@router.get("/documents", response_model=list[DocumentOut])
def list_documents(
    source: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
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
