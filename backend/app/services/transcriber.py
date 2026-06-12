# backend/app/services/transcriber.py
import os
import logging
import whisper  # Open-source engine running locally on your hardware
from app.services.audio_processor import compress_media_to_whisper_spec

logger = logging.getLogger("backend.app.services.transcriber")

# PRODUCTION PATH CONFIGURATION
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", DEFAULT_UPLOAD_DIR)

def transcribe_community_audio(filename: str) -> str:
    """
    Core production service pipeline wrapper using FREE local Whisper engine.
    1. Resolves paths dynamically.
    2. Runs file size defense checks (compressing if > 24.5 MB to save RAM memory).
    3. Executes local speech recognition using the Whisper 'base' model footprint.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    input_file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(input_file_path):
        logger.error(f"Target media file does not exist at local path: {input_file_path}")
        raise FileNotFoundError(f"Media asset '{filename}' not found in uploads directory.")

    # Compress if file size is too heavy to prevent local computer memory lag
    processed_path = compress_media_to_whisper_spec(input_file_path)

    try:
        # Load local model footprint balance criteria: 
        # "base" provides accurate human speech text without consuming heavy RAM/GPU resources.
        logger.info("Initializing free local Whisper engine into memory storage...")
        local_model = whisper.load_model("base")
        
        logger.info(f"Processing local speech recognition tracking for: {os.path.basename(processed_path)}")
        
        # Execute transcription matrix natively on your PC hardware
        result_payload = local_model.transcribe(
            processed_path,
            language="en",
            temperature=0.0
        )
        
        logger.info(f"Local Whisper transcription completed successfully for {filename}")
        return result_payload.get("text", "").strip()

    except Exception as local_err:
        logger.error(f"Failed to execute local model transcription matrix: {local_err}")
        raise RuntimeError(f"Local speech pipeline processing error: {local_err}")
        
    finally:
        # Clean up temporary artifact if compressor step generated a light MP3 file
        if processed_path != input_file_path and os.path.exists(processed_path):
            try:
                os.remove(processed_path)
                logger.info("Cleaned up temporary optimized media file artifact safely from workspace.")
            except Exception as clear_err:
                logger.warning(f"Unable to drop temporary artifact file reference: {clear_err}")