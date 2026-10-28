from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta, datetime
import os
import re

from app.database import get_db
from app.models.user import User
from app.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, get_current_admin

router = APIRouter()

# Optional whitelist to restrict signups. By default, open registration is enabled for all new users.
# Set ENFORCE_SIGNUP_WHITELIST=true and populate ALLOWED_EMAILS in .env only if you wish to restrict signups.
_allowed_raw = os.getenv("ALLOWED_EMAILS", "").strip()
ALLOWED_EMAILS = [e.strip().lower() for e in _allowed_raw.split(",") if e.strip()] if (_allowed_raw and _allowed_raw != "*") else []
ENFORCE_WHITELIST = os.getenv("ENFORCE_SIGNUP_WHITELIST", "false").lower() in ("true", "1", "yes")

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class PasswordReset(BaseModel):
    email: str
    new_password: str

def send_simulated_email(to_email: str, subject: str, body: str):
    print(f"\n==================================================")
    print(f"[EMAIL SIMULATOR] Sending email to: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body:\n{body}")
    print(f"==================================================\n")

@router.post("/api/v1/auth/reset-password")
def reset_password(payload: PasswordReset, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    if not is_valid_email(email_clean):
        raise HTTPException(status_code=400, detail="The email format is invalid")
        
    user = db.query(User).filter(User.email.ilike(email_clean)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The email address is not registered"
        )
        
    if email_clean == "admin@arin-africa.org":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password reset is disabled for administrator accounts."
        )
        
    hashed_password = get_password_hash(payload.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    send_simulated_email(
        to_email=user.email,
        subject="ARIN Climate DSS Password Reset",
        body=f"Hello {user.name},\n\nYour password has been successfully reset. If you did not make this request, please contact an administrator."
    )
    
    return {"status": "success", "message": "Password updated successfully"}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

def is_valid_email(email: str) -> bool:
    regex = r'^\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    return bool(re.match(regex, email))

@router.post("/api/v1/auth/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    email_clean = user.email.strip().lower()
    name_clean = user.name.strip()

    if ENFORCE_WHITELIST and ALLOWED_EMAILS and email_clean not in ALLOWED_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Signup restricted. Please contact an administrator."
        )

    if not is_valid_email(email_clean):
        raise HTTPException(status_code=400, detail="The email format is invalid")
        
    db_user = db.query(User).filter(User.email.ilike(email_clean)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(name=name_clean, email=email_clean, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": new_user.name, "email": new_user.email}}

@router.post("/api/v1/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username_clean = form_data.username.strip().lower()
    if not is_valid_email(username_clean):
        raise HTTPException(status_code=400, detail="The email format is invalid")

    user = db.query(User).filter(User.email.ilike(username_clean)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The email is invalid or not registered",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user.login_count = (user.login_count or 0) + 1
    user.last_login = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": user.name, "email": user.email}}

@router.get("/api/v1/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"name": current_user.name, "email": current_user.email}

@router.get("/api/v1/admin/users/stats")
def get_user_stats(db: Session = Depends(get_db), admin_user: User = Depends(get_current_admin)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.login_count > 0).count()
    return {"total_users": total_users, "active_users": active_users}
