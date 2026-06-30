from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, index=True)
    url = Column(Text)
    date = Column(Text)
    type = Column(Text)
    body = Column(Text)
    file_url = Column(Text)
    source = Column(Text, index=True)
    country = Column(Text, index=True)
    scraped_at = Column(DateTime)
    content_text = Column(Text)
