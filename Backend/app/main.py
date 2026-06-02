# backend/app/main.py
from fastapi import FastAPI
from app.api.ingest import router as ingest_router
from app.api.admin_media import router as admin_media_router  

app = FastAPI(title="ARIN Climate Decision Support System API")

# Mount your routes
app.include_router(ingest_router)
app.include_router(admin_media_router)  

@app.get("/")
def read_root():
    return {"message": "ARIN Climate DSS Backend API Core Server Online."}