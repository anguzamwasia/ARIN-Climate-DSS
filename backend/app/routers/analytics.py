from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.kobo import KoboSubmission

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# The frontend dashboard (frontend/app/dashboard/page.tsx) requests these 28
# country codes directly. Extend as more countries get scraped coverage.
COUNTRY_NAMES = {
    "KE": "Kenya", "TZ": "Tanzania", "UG": "Uganda", "ET": "Ethiopia", "NG": "Nigeria",
    "GH": "Ghana", "ZA": "South Africa", "EG": "Egypt", "SD": "Sudan", "SS": "South Sudan",
    "CD": "DR Congo", "MZ": "Mozambique", "MW": "Malawi", "ZM": "Zambia", "ZW": "Zimbabwe",
    "SN": "Senegal", "ML": "Mali", "NE": "Niger", "BF": "Burkina Faso", "TD": "Chad",
    "SO": "Somalia", "CM": "Cameroon", "RW": "Rwanda", "MA": "Morocco", "TN": "Tunisia",
    "DZ": "Algeria", "AO": "Angola", "MG": "Madagascar",
}


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_documents = db.query(func.count(Document.id)).filter(
        Document.source.in_(["UNFCCC", "KNBS", "World Bank", "KMD", "ARIN"])
    ).scalar() or 0
    total_media = db.query(func.count(Document.id)).filter(Document.source == "WHISPER").scalar() or 0
    total_blogs = db.execute(text("SELECT COUNT(*) FROM blogs WHERE status = 'approved'")).scalar() or 0
    countries_covered = db.query(func.count(func.distinct(Document.country))).filter(
        Document.source == "UNFCCC", Document.country != "Africa (Global)"
    ).scalar() or 0

    return {
        "total_documents": total_documents,
        "total_media": total_media,
        "total_blogs": total_blogs,
        "countries_covered": countries_covered,
    }


@router.get("/country/{code}")
def get_country(code: str, db: Session = Depends(get_db)):
    code = code.upper()
    name = COUNTRY_NAMES.get(code, code)

    doc_count = db.query(func.count(Document.id)).filter(Document.country.ilike(f"%{name}%")).scalar() or 0
    submission_count = db.query(func.count(KoboSubmission.id)).filter(
        KoboSubmission.country.ilike(f"%{name}%")
    ).scalar() or 0

    # NOTE: avg_temperature_rise / flood_risk / drought_index / population_affected
    # have no real data source anywhere in this pipeline -- the scrapers ingest
    # policy PDFs and Kobo field surveys, not numeric climate indicators. Rather
    # than fabricating plausible-looking numbers, these are left at honest
    # zero/"unknown" defaults until a real indicator feed (e.g. the World Bank
    # Climate Change Knowledge Portal API) is wired into the ingestion layer.
    # doc_count / submission_count below ARE real, derived from the database.
    return {
        "code": code,
        "name": name,
        "avg_temperature_rise": 0.0,
        "flood_risk": "unknown",
        "drought_index": 0.0,
        "population_affected": 0,
        "doc_count": doc_count,
        "submission_count": submission_count,
    }


@router.get("/timeseries")
def get_timeseries(indicator: str = Query(...), country: Optional[str] = Query(None)):
    # Same gap as above: no real time-series climate indicator source is wired
    # in yet. Returns an empty series (not fabricated points) so the frontend
    # chart renders its real "no data available" state.
    return []


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    features = []
    for code, name in COUNTRY_NAMES.items():
        doc_count = db.query(func.count(Document.id)).filter(Document.country.ilike(f"%{name}%")).scalar() or 0
        features.append({
            "type": "Feature",
            "properties": {
                "code": code,
                "name": name,
                "doc_count": doc_count,
                # See get_country(): no real vulnerability-index data source yet.
                "vulnerability_index": None,
            },
            "geometry": None,
        })
    return {"type": "FeatureCollection", "features": features}
