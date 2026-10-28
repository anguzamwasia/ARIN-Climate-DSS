import os
import shutil
import httpx
import asyncio
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from app.database import SessionLocal
from app.services.transcriber import transcribe_community_audio, UPLOAD_DIR
from app.models.user import User
from app.auth import get_current_admin

logger = logging.getLogger("backend.app.routers.transcription")

router = APIRouter(prefix="/api/v1", tags=["Transcription"])


class KoboWebhookPayload(BaseModel):
    form_id: Optional[str] = Field(None, alias="_xform_id_string")
    submission_id: int = Field(..., alias="_id")
    attachments: list = Field(default=[])

    class Config:
        populate_by_name = True
        extra = "allow"


def generate_clean_media_title(filename: str) -> str:
    import re
    cleaned = filename
    cleaned = re.sub(r'^(admin|kobo)_\d+_', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'__+', ' - ', cleaned)
    cleaned = re.sub(r'\s*\(\d+\)\s*', ' ', cleaned)
    cleaned = re.sub(r'\.(mp4|mp3|wav|avi|m4a)$', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace('_', ' ').strip()
    words = [w.capitalize() for w in cleaned.split() if w]
    clean_title = " ".join(words)
    return clean_title or f"Media Recording ({filename})"

def generate_extractive_summary(transcript: str) -> str:
    if not transcript:
        return "Audio/video session transcribed and processed into the ARIN Decision Support System."
    import re
    paragraphs = [p.strip() for p in transcript.split('\n\n') if p.strip()]
    meaningful = []
    mic_words = {"can you see", "presentation mode", "testing", "mic check", "can you hear"}
    for p in paragraphs:
        if any(mw in p.lower() for mw in mic_words) and len(meaningful) == 0:
            continue
        meaningful.append(p)
        if len(meaningful) >= 3:
            break
    if meaningful:
        return "\n\n".join(meaningful)
    return transcript[:500].strip()

def save_transcript_to_db(filename: str, transcript: str, country: str = "", description: Optional[str] = None):
    from app.models.document import Document
    db = SessionLocal()
    try:
        clean_title = generate_clean_media_title(filename)
        clean_body = description or generate_extractive_summary(transcript)
        new_doc = Document(
            title=clean_title,
            url="",
            date="",
            type="transcript",
            body=clean_body,
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


@router.post("/ingest/kobo-receiver", status_code=status.HTTP_202_ACCEPTED)
async def receive_kobo_form_submission(payload: KoboWebhookPayload, background_tasks: BackgroundTasks):
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


def process_admin_media_async(filename: str, description: Optional[str] = None):
    try:
        raw_transcript = transcribe_community_audio(filename)
        transcript = punctuate_transcript(raw_transcript)
        save_transcript_to_db(filename, transcript, description=description)
        logger.info(f"Admin media processed: {filename}")
    except Exception as e:
        logger.error(f"Admin media processing failed for {filename}: {e}")


@router.post("/admin/media/upload", status_code=status.HTTP_202_ACCEPTED)
async def admin_upload_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    description: str = Form(...),
    current_admin: User = Depends(get_current_admin)
):
    filename = file.filename
    if not filename.lower().endswith((".mp3", ".mp4", ".wav", ".m4a")):
        raise HTTPException(status_code=400, detail="Unsupported media format")
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
    sanitized_filename = f"admin_{int(datetime.utcnow().timestamp())}_{filename.replace(' ', '_')}"
    destination_path = os.path.join(UPLOAD_DIR, sanitized_filename)
    try:
        with open(destination_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
    finally:
        file.file.close()
    background_tasks.add_task(process_admin_media_async, sanitized_filename, description)
    return {"status": "queued", "internal_filename": sanitized_filename}


class LinkIngestionRequest(BaseModel):
    url: str
    description: str


def download_and_process_link_pipeline(url: str, sanitized_filename: str, description: Optional[str] = None):
    try:
        destination_path = os.path.join(UPLOAD_DIR, sanitized_filename)
        
        # 1. Check if it is a YouTube URL
        is_youtube = "youtube.com" in url.lower() or "youtu.be" in url.lower()
        
        if is_youtube:
            import yt_dlp
            # yt-dlp options: extract audio to native format (bestaudio)
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(UPLOAD_DIR, sanitized_filename.replace('.mp3', '')), # yt-dlp appends its own extension
            }
            # Add cookies check if a cookies.txt file exists in backend root to bypass cloud IP block lists
            cookies_path = "/app/cookies.txt"
            if os.path.exists(cookies_path):
                ydl_opts['cookiefile'] = cookies_path
            elif os.path.exists("cookies.txt"):
                ydl_opts['cookiefile'] = "cookies.txt"
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                downloaded_file = ydl.prepare_filename(info)
                if os.path.exists(downloaded_file):
                    shutil.move(downloaded_file, destination_path)
        else:
            # 2. Generic direct live video link download
            import requests
            response = requests.get(url, stream=True, timeout=120)
            if response.status_code != 200:
                raise Exception(f"Failed to download video stream. HTTP Status: {response.status_code}")
            with open(destination_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
        # 3. Transcribe downloaded media
        process_admin_media_async(sanitized_filename, description)
        logger.info(f"Link ingestion pipeline finished successfully for: {url}")
    except Exception as e:
        logger.error(f"Link ingestion pipeline failed for {url}: {e}")
        # Log a failed transcript entry so the administrator can see the failure status in the dashboard
        from app.models.document import Document
        db = SessionLocal()
        try:
            new_doc = Document(
                title=f"Failed Transcript: {url[:60]}",
                url=url,
                date="",
                type="transcript",
                body=f"Failed to ingest live stream link. Description: {description}. Error: {str(e)}",
                file_url="failed",
                source="WHISPER",
                country="Unknown",
                scraped_at=datetime.utcnow(),
                content_text=f"Link Ingestion Failure details:\n{str(e)}"
            )
            db.add(new_doc)
            db.commit()
        except Exception as db_err:
            logger.error(f"Failed to record link ingestion failure in database: {db_err}")
        finally:
            db.close()


@router.post("/admin/media/link", status_code=status.HTTP_202_ACCEPTED)
async def admin_ingest_media_link(
    background_tasks: BackgroundTasks,
    req: LinkIngestionRequest,
    current_admin: User = Depends(get_current_admin)
):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    description = req.description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description/Tags are mandatory")
        
    # We download as audio to fit existing Whisper transcription pipeline
    # Name the file based on timestamp to prevent collision
    sanitized_filename = f"admin_link_{int(datetime.utcnow().timestamp())}.mp3"
    
    background_tasks.add_task(download_and_process_link_pipeline, url, sanitized_filename, description)
    return {"status": "queued", "internal_filename": sanitized_filename}


@router.post("/admin/media/cookies", status_code=status.HTTP_200_OK)
async def admin_upload_cookies(file: UploadFile = File(...), current_admin: User = Depends(get_current_admin)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be a cookies.txt file")
    
    cookies_path = "/app/cookies.txt"
    try:
        with open(cookies_path, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
    except Exception as e:
        # Fallback to local execution directory if /app/ is not writable or doesn't exist
        try:
            with open("cookies.txt", "wb") as buf:
                shutil.copyfileobj(file.file, buf)
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Failed to save cookies file: {str(e2)}")
    finally:
        file.close()
        
    return {"status": "success", "message": "YouTube authentication cookies uploaded successfully"}
