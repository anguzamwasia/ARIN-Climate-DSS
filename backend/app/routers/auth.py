from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta, datetime
import re

from app.config import get_allowed_emails
from app.database import get_db
from app.models.user import User
from app.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, require_admin

router = APIRouter()

# The email that is promoted to role="admin" on signup, matching the account
# the auto-migration in main.py already promotes for existing installs.
PRIMARY_ADMIN_EMAIL = "admin@arin-africa.org"

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

def is_valid_email(email: str) -> bool:
    regex = r'^\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    return bool(re.match(regex, email))

@router.post("/api/v1/auth/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if not is_valid_email(user.email):
        raise HTTPException(status_code=400, detail="The email format is invalid")

    if user.email not in get_allowed_emails():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is not authorized to create an account. Contact an ARIN admin.",
        )

    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    role = "admin" if user.email == PRIMARY_ADMIN_EMAIL else "user"
    new_user = User(name=user.name, email=user.email, hashed_password=hashed_password, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer", "user": {"name": new_user.name, "email": new_user.email, "role": new_user.role}}

@router.post("/api/v1/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if not is_valid_email(form_data.username):
        raise HTTPException(status_code=400, detail="The email format is invalid")

    user = db.query(User).filter(User.email == form_data.username).first()
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

    return {"access_token": access_token, "token_type": "bearer", "user": {"name": user.name, "email": user.email, "role": user.role}}

@router.get("/api/v1/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"name": current_user.name, "email": current_user.email, "role": current_user.role}

@router.get("/api/v1/admin/users/stats")
def get_user_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.login_count > 0).count()
    return {"total_users": total_users, "active_users": active_users}
