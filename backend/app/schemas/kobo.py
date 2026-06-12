from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class KoboSubmissionBase(BaseModel):
    kobo_id: str = Field(..., alias="_id")
    form_id: str = Field(..., alias="_xform_id_string")
    country: str
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    kobo_submitted_at: Optional[datetime] = Field(None, alias="_submission_time")

    class Config:
        populate_by_name = True 

class KoboSubmissionCreate(KoboSubmissionBase):
    raw_data: Dict[str, Any]

class KoboSubmissionResponse(KoboSubmissionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True 