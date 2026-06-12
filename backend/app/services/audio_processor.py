# backend/app/services/audio_processor.py
import os
import subprocess
import logging

logger = logging.getLogger("backend.app.services.audio_processor")

# 24.5 MB threshold boundary to never trigger Whisper API file size rejection blocks
MAX_SIZE_BYTES = 24.5 * 1024 * 1024

def is_ffmpeg_installed() -> bool:
    """
    Validates that the system running the backend has the ffmpeg binary 
    properly installed and exposed in its system environment PATH.
    """
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except (FileNotFoundError, Exception):
        logger.error("FFmpeg utility was not detected in the current operating system environment.")
        return False

def compress_media_to_whisper_spec(input_path: str) -> str:
    """
    Evaluates the file size of an mp3 or mp4 file inside the uploads directory. 
    If it exceeds 25MB, it leverages FFmpeg to transcode the media down to a 
    speech-optimized, highly compressed mono, 16kHz, 32kbps MP3 file.
    
    Args:
        input_path (str): The full absolute path to the uploaded file.
        
    Returns:
        str: Absolute file path to the version that should be sent to Whisper.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Target media file does not exist at path: {input_path}")

    current_size_bytes = os.path.getsize(input_path)
    current_size_mb = current_size_bytes / (1024 * 1024)

    # Bypass compression optimization if the file is already small enough
    if current_size_bytes <= MAX_SIZE_BYTES:
        logger.info(f"File '{os.path.basename(input_path)}' is safely under 25MB ({current_size_mb:.2f} MB). Skipping compression.")
        return input_path

    logger.warning(f"Large media input detected: '{os.path.basename(input_path)}' ({current_size_mb:.2f} MB). Starting compression...")

    if not is_ffmpeg_installed():
        raise RuntimeError("System missing dependency: FFmpeg must be installed to compress files above 25MB limit.")

    # Derive output destination inside the exact same uploads folder location
    directory = os.path.dirname(input_path)
    raw_filename = os.path.splitext(os.path.basename(input_path))[0]
    output_path = os.path.join(directory, f"{raw_filename}_optimized.mp3")

    # Command parameters optimized for human voice transcription metrics:
    # -vn: Drop video container structures instantly to drop file weight (essential for MP4s)
    # -ac 1: Convert stereo or multi-track audio channels down to single mono tracking
    # -b:a 32k: Allocate bit rate execution to 32kbps to preserve baseline speech clarity while slashing size
    # -ar 16000: Align audio clock frequency down to native Whisper model index (16,000Hz)
    ffmpeg_command = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vn",
        "-ac", "1",
        "-b:a", "32k",
        "-ar", "16000",
        output_path
    ]

    try:
        # Run FFmpeg synchronously 
        subprocess.run(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        
        compressed_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        logger.info(f"Compression completed successfully. New file saved in uploads: {os.path.basename(output_path)} ({compressed_size_mb:.2f} MB)")
        return output_path

    except subprocess.CalledProcessError as err:
        logger.error(f"FFmpeg command processing fault: {err.stderr}")
        raise RuntimeError(f"FFmpeg compression pipeline failed: {err.stderr}")