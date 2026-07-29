from sqlalchemy import Column, Integer, Text, DateTime
from app.database import Base
from datetime import datetime

class ChatbotFeedback(Base):
    __tablename__ = "chatbot_feedback"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False) # 1 for up, -1 for down
    created_at = Column(DateTime, default=datetime.utcnow)
