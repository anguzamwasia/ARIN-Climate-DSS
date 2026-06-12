from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class KoboSubmission(Base):
    __tablename__ = "kobo_submissions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Kobo specific unique identifiers
    kobo_id = Column(String, unique=True, index=True, nullable=False) # Maps to `_id` in Kobo
    form_id = Column(String, index=True, nullable=False)             # Maps to `_xform_id_string`
    
    # Metadata tracked from the submission
    submitted_by = Column(String, index=True, nullable=True)         # User who submitted field form
    country = Column(String, index=True, nullable=False)              # Regional breakdown marker
    location_name = Column(String, nullable=True)                    # Community or village name
    
    # Geospatial parameters mapped out for your Leaflet Dashboard markers
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Storage for the full, unparsed JSON payload for backup/future extraction
    raw_data = Column(JSON, nullable=False)
    
    # Lifecycle timestamps
    kobo_submitted_at = Column(DateTime, nullable=True)              # When it was submitted to Kobo
    created_at = Column(DateTime(timezone=True), server_default=func.now())