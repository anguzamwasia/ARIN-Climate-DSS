import os
import shutil
import uuid
import httpx
import asyncio
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, BackgroundTasks, UploadFile, File, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from app.auth import require_admin
from app.database import SessionLocal
from app.models.user import User
from app.services.transcriber import transcribe_community_audio, UPLOAD_DIR

logger = logging.getLogger("backend.app.routers.transcription")

router = APIRouter(prefix="/api/v1", tags=["Transcription"])


class KoboWebhookPayload(BaseModel):
    form_id: Optional[str] = Field(None, alias="_xform_id_string")
    submission_id: int = Field(..., alias="_id")
    attachments: list = Field(default=[])

    class Config:
        populate_by_name = True
        extra = "allow"


def save_transcript_to_db(filename: str, transcript: str, country: str = ""):
    from app.models.document import Document
    db = SessionLocal()
    try:
        new_doc = Document(
            title=f"Transcript: {filename}",
            url="",
            date="",
            type="transcript",
            body=transcript[:300],
            file_url=filename,
            source="WHISPER",
            country=country,
            scraped_at=datetime.utcnow(),
            content_text=transcript
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        logger.info(f"Saved transcript for {filename} into documents table with ID {new_doc.id}")

        # Insert into ChromaDB
        import chromadb
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
        collection = chroma_client.get_or_create_collection(name="climate_docs")
        
        text_to_embed = f"Title: {new_doc.title}\nSource: {new_doc.source}\nCountry: {new_doc.country}\nContent: {transcript[:3000]}"
        
        collection.upsert(
            documents=[text_to_embed],
            metadatas=[{
                "title": new_doc.title,
                "source": new_doc.source,
                "country": new_doc.country or "Unknown",
                "original_id": str(new_doc.id)
            }],
            ids=[f"doc_{new_doc.id}"]
        )
        logger.info(f"Embedded transcript for {filename} into ChromaDB")
    finally:
        db.close()


async def download_kobo_media_asset(media_url: str, target_filename: str) -> bool:
    destination_path = os.path.join(UPLOAD_DIR, target_filename)
    headers = {"User-Agent": "ARIN-Climate-DSS-Backend/1.0"}
    kobo_token = os.getenv("KOBO_API_TOKEN")
    if kobo_token:
        headers["Authorization"] = f"Token {kobo_token}"
    try:
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            async with client.stream("GET", media_url, headers=headers) as stream:
                if stream.status_code != 200:
                    logger.error(f"Kobo download failed: {stream.status_code}")
                    return False
                if not os.path.exists(UPLOAD_DIR):
                    os.makedirs(UPLOAD_DIR, exist_ok=True)
                with open(destination_path, "wb") as out:
                    async for chunk in stream.iter_bytes(chunk_size=8192):
                        out.write(chunk)
        return True
    except Exception as e:
        logger.error(f"Kobo download error: {e}")
        return False


def punctuate_transcript(text_content: str) -> str:
    import os
    from openai import OpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return text_content
    try:
        client = OpenAI(api_key=api_key)
        prompt = (
            "You are an expert transcriber. Your task is to add clean punctuation, capitalization, and paragraph breaks "
            "to the following raw transcription text. Keep the words exactly as spoken, do not add or remove any content, "
            "and do not change any phrasing. Format the output with clean spacing and paragraphs for readability.\n\n"
            f"Raw Transcription:\n{text_content}"
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Failed to punctuate transcript via OpenAI: {e}")
        return text_content


def process_webhook_speech_pipeline(media_url: str, filename: str, submission_id: int):
    try:
        ok = asyncio.run(download_kobo_media_asset(media_url, filename))
        if not ok:
            logger.error(f"Aborting pipeline for submission {submission_id}")
            return
        raw_transcript = transcribe_community_audio(filename)
        transcript = punctuate_transcript(raw_transcript)
        save_transcript_to_db(filename, transcript)
        logger.info(f"Pipeline complete for submission {submission_id}")
    except Exception as e:
        logger.critical(f"Pipeline crash for submission {submission_id}: {e}")


def verify_kobo_webhook(x_webhook_secret: Optional[str] = Header(default=None)):
    # KoboToolbox REST Services can send a custom header on every webhook call
    # (configured in the Kobo project's REST Services settings). This is not a
    # user JWT -- Kobo is a machine caller -- but an unauthenticated receiver
    # otherwise lets anyone queue arbitrary "audio" downloads/transcriptions.
    expected = os.getenv("KOBO_WEBHOOK_SECRET")
    if expected and x_webhook_secret != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")


@router.post("/ingest/kobo-receiver", status_code=status.HTTP_202_ACCEPTED)
async def receive_kobo_form_submission(payload: KoboWebhookPayload, background_tasks: BackgroundTasks, _verified: None = Depends(verify_kobo_webhook)):
    target_media_url = None
    target_filename = None
    for attachment in payload.attachments:
        download_url = attachment.get("download_url")
        filename = attachment.get("filename")
        if download_url and filename:
            if filename.lower().endswith((".mp3", ".mp4", ".wav", ".m4a", ".aac", ".ogg", ".3gp")):
                target_media_url = download_url
                target_filename = f"kobo_{payload.submission_id}_{filename}"
                break
    if not target_media_url:
        return {"status": "ignored", "reason": "No audio/video attachment found"}
    background_tasks.add_task(process_webhook_speech_pipeline, target_media_url, target_filename, payload.submission_id)
    return {"status": "queued", "submission_id": payload.submission_id, "filename": target_filename}


def process_admin_media_async(filename: str):
    try:
        raw_transcript = transcribe_community_audio(filename)
        transcript = punctuate_transcript(raw_transcript)
        save_transcript_to_db(filename, transcript)
        logger.info(f"Admin media processed: {filename}")
    except Exception as e:
        logger.error(f"Admin media processing failed for {filename}: {e}")


@router.post("/admin/media/upload", status_code=status.HTTP_202_ACCEPTED)
async def admin_upload_media(background_tasks: BackgroundTasks, file: UploadFile = File(...), _admin: User = Depends(require_admin)):
    filename = file.filename or ""
    if not filename.lower().endswith((".mp3", ".mp4", ".wav", ".m4a")):
        raise HTTPException(status_code=400, detail="Unsupported media format")
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(filename)[1].lower()
    # Server-generated filename -- never trust the client-supplied name for a
    # filesystem path (same path-traversal class of issue as the document
    # upload route).
    sanitized_filename = f"admin_{uuid.uuid4().hex}{ext}"
    destination_path = os.path.join(UPLOAD_DIR, sanitized_filename)
    try:
        with open(destination_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
    finally:
        file.file.close()
    background_tasks.add_task(process_admin_media_async, sanitized_filename)
    return {"status": "queued", "internal_filename": sanitized_filename}
