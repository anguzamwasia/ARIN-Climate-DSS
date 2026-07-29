from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # server_default needs literal quotes -- SQLAlchemy passes a plain string
    # through as raw DDL text, so server_default="user" (no quotes) would emit
    # invalid SQL (`DEFAULT user`, parsed as a bare identifier, not a string).
    role = Column(String, nullable=False, default="user", server_default="'user'")
    login_count = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
