# backend/app/api/admin_media.py
import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, status
from app.services.transcriber import transcribe_community_audio, UPLOAD_DIR

logger = logging.getLogger("backend.app.api.admin_media")

router = APIRouter(prefix="/api/v1/admin/media", tags=["Admin Portal Infrastructure"])

# Non-blocking worker loop for manual uploads
def process_admin_media_async(filename: str):
    try:
        logger.info(f"Admin triggered processing pipeline for media item: {filename}")
        transcription_result = transcribe_community_audio(filename)
        
        # 🚀 DATABASE SYNC BRIDGE PLACEHOLDER
        # This is where the output text will be saved to your DB tracking system (e.g., SQLAlchemy)
        logger.info(f"🎉 Admin asset successfully processed: {filename}")
        logger.debug(f"Resulting snippet: {transcription_result[:100]}...")
        
    except Exception as err:
        logger.error(f"Failed to process admin media asset '{filename}': {err}")

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def admin_upload_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Admin Portal Gateway Endpoint:
    Allows authenticated administrators to upload heavy audio/video (.mp3, .mp4) 
    directly to the system and queues it for localized Whisper transcription.
    """
    filename = file.filename
    if not filename.lower().endswith(('.mp3', '.mp4', '.wav', '.m4a')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported media format. Please provide an .mp3, .mp4, .wav, or .m4a file."
        )
    
    # Prevent spaces in files from throwing off OS/FFmpeg lookups
    sanitized_filename = f"admin_{int(os.path.getsize(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else 0)}_{filename.replace(' ', '_')}"
    destination_path = os.path.join(UPLOAD_DIR, sanitized_filename)
    
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
    try:
        # Stream the file content directly from memory into your uploads volume folder
        with open(destination_path, "wb") as local_buffer:
            shutil.copyfileobj(file.file, local_buffer)
        logger.info(f"Admin uploaded file saved successfully to: {destination_path}")
        
    except Exception as io_err:
        logger.error(f"Failed to write admin uploaded file to disk: {io_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file stream locally: {io_err}"
        )
    finally:
        file.file.close()

    # Hand off execution immediately to your free offline pipeline background thread
    background_tasks.add_task(process_admin_media_async, sanitized_filename)

    return {
        "status": "success",
        "message": f"File '{filename}' successfully saved into application workspace. Local background transcription pipeline initiated.",
        "internal_filename": sanitized_filename
    }