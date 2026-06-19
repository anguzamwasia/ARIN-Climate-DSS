# backend/app/api/ingest.py
import os
import httpx
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.services.transcriber import transcribe_community_audio, UPLOAD_DIR

logger = logging.getLogger("backend.app.api.ingest")

router = APIRouter(prefix="/api/v1/ingest", tags=["Kobo Ingestion Engine"])

# 1. Pydantic Schemes for Structural Validation of Kobo Webhooks
class KoboWebhookPayload(BaseModel):
    form_id: Optional[str] = Field(None, alias="_xform_id_string")
    submission_id: int = Field(..., alias="_id")
    attachments: list = Field(default=[])
    
    # Allows additional unstructured dynamic metadata fields from the form
    class Config:
        populate_by_name = True
        extra = "allow"


# 2. Resilient Async Downloader to pull binary streams from Kobo
async def download_kobo_media_asset(media_url: str, target_filename: str) -> bool:
    """
    Downloads raw binary speech media files directly from secured Kobo servers
    and writes them into the local dynamic dynamic volume tracking system.
    """
    destination_path = os.path.join(UPLOAD_DIR, target_filename)
    # Ensure header handshakes match standard browser interactions
    headers = {"User-Agent": "ARIN-Climate-DSS-Backend/1.0"}
    
    # Retrieve authorization configuration token if Kobo asset access is locked behind auth
    kobo_token = os.getenv("KOBO_API_TOKEN")
    if kobo_token:
        headers["Authorization"] = f"Token {kobo_token}"

    try:
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as http_client:
            logger.info(f"Initiating binary download stream from Kobo asset node: {media_url}")
            async with http_client.stream("GET", media_url, headers=headers) as network_stream:
                if network_stream.status_code != 200:
                    logger.error(f"Kobo download terminal rejected connection: Status code {network_stream.status_code}")
                    return False
                
                with open(destination_path, "wb") as local_file:
                    async for chunk in network_stream.iter_bytes(chunk_size=8192):
                        local_file.write(chunk)
            
            logger.info(f"Successfully pinned media payload safely into storage volume: {destination_path}")
            return True
    except Exception as network_err:
        logger.error(f"Failed to pull stream artifact from cloud source link: {network_err}")
        return False


# 3. Non-blocking Background Task Worker Worker Pipeline
def process_webhook_speech_pipeline(media_url: str, filename: str, submission_id: int):
    """
    Synchronous worker pipeline executed in a safe isolated thread block.
    Guarantees web servers do not crash or timeout during heavy machine processing loops.
    """
    try:
        import asyncio
        # Run async downloader inside worker thread safely
        download_success = asyncio.run(download_kobo_media_asset(media_url, filename))
        
        if not download_success:
            logger.error(f"Aborting transcription pipeline for submit ID #{submission_id} due to network errors.")
            return

        logger.info(f"Beginning localized speech processing array on background thread for asset: {filename}")
        transcription_result = transcribe_community_audio(filename)
        
        # =========================================================================
        # 🚀 DATABASE SYNC BRIDGE PLACEHOLDER
        # =========================================================================
        # This is where we will hook up our SQLAlchemy database save mechanism.
        # For now, we will print out a success log showing the pipeline completed!
        logger.info(f"🎉 SUCCESS! Transcript text compiled for Submission #{submission_id}")
        logger.debug(f"Snippet extracted: {transcription_result[:100]}...")
        # =========================================================================

    except Exception as pipeline_err:
        logger.critical(f"Background processor encountered unrecoverable crash on Sub ID #{submission_id}: {pipeline_err}")


# 4. Main Webhook API Endpoint receiver
@router.post("/kobo-receiver", status_code=status.HTTP_202_ACCEPTED)
async def receive_kobo_form_submission(
    payload: KoboWebhookPayload, 
    background_tasks: BackgroundTasks
):
    """
    Main webhook entry point designed for high-availability ingest configurations.
    1. Instantly validates incoming form structure metadata.
    2. Scans attachments list arrays looking for audio/video media components.
    3. Handoffs the execution immediately to an offline thread worker to keep API latency under 50ms.
    """
    logger.info(f"Incoming webhook handshake registered for form submission token ID: #{payload.submission_id}")
    
    # Track down the audio or video target component from Kobo payload structures
    target_media_url = None
    target_filename = None
    
    for attachment in payload.attachments:
        download_url = attachment.get("download_url")
        filename = attachment.get("filename")
        
        if download_url and filename:
            # Check for standard audio/video payload extensions
            if filename.lower().endswith(('.mp3', '.mp4', '.wav', '.m4a', '.aac', '.ogg', '.3gp')):
                target_media_url = download_url
                # Prevent filename collisions by prefixing with unique submission IDs
                target_filename = f"kobo_{payload.submission_id}_{filename}"
                break

    if not target_media_url:
        logger.warning(f"Submission validation complete for ID #{payload.submission_id}. No valid audio recordings detected. Skipping processing loop.")
        return {"status": "ignored", "reason": "No audio/video record found within payload attachment schemas."}

    # Delegate the data collection and machine execution directly to non-blocking engine pools
    background_tasks.add_task(
        process_webhook_speech_pipeline, 
        target_media_url, 
        target_filename, 
        payload.submission_id
    )

    return {
        "status": "queued",
        "message": f"Media ingest array successfully initialized for file: '{target_filename}'. Local speech extraction running in decoupled threads.",
        "submission_id": payload.submission_id
    }