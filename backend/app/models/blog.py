from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author_name = Column(String)
    post_type = Column(String)
    summary = Column(Text, nullable=True)
    background = Column(Text, nullable=True)
    findings = Column(Text, nullable=True)
    implications = Column(Text, nullable=True)
    narrative = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    sources = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime)
    reviewed_at = Column(DateTime, nullable=True)
