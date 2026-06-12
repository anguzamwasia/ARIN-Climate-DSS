# backend/app/services/test_pipeline.py
import os
import sys
import logging

# 1. Set up immediate logging to screen
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# 2. Fix import paths so Python knows where the "app" folder is
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(BASE_DIR)

from app.services.transcriber import transcribe_community_audio, UPLOAD_DIR
from app.services.audio_processor import is_ffmpeg_installed

def verify_pipeline():
    print("\n" + "="*50)
    print("   ARIN CLIMATE DSS - LOCAL OFFLINE PIPELINE TEST   ")
    print("="*50)

    # Validate FFmpeg
    if is_ffmpeg_installed():
        print("✅ FFmpeg dependency detected successfully.")
    else:
        print("❌ FFmpeg was NOT found in your environment PATH.")
        return

    # Check the dynamic uploads directory location
    print(f"📁 Dynamic Production Uploads Folder: {UPLOAD_DIR}")
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        print("👉 Created the uploads directory dynamically.")
        print(f"👉 Action required: Please drop a test .mp3 or .mp4 into: {UPLOAD_DIR} and rerun.")
        return

    # Scan for media files (.mp3, .mp4, etc.)
    files = [f for f in os.listdir(UPLOAD_DIR) if f.lower().endswith(('.mp3', '.mp4', '.wav', '.m4a'))]
    if not files:
        print("⚠️  The uploads folder is empty.")
        print(f"👉 Action required: Drop a test audio or video file into: {UPLOAD_DIR}")
        return

    # Target the first file found in the folder
    target_file = files[0]
    file_path = os.path.join(UPLOAD_DIR, target_file)
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"🎯 Targeted file for analysis: {target_file} ({size_mb:.2f} MB)")

    # Execute free end-to-end local processing pipeline
    print("\n🚀 Firing full local compression + Whisper execution pipeline...")
    try:
        text_data = transcribe_community_audio(target_file)
        print("\n" + "-"*50)
        print("🎉 PIPELINE SUCCESS! LOCAL WHISPER TRANSCRIPTION OUTPUT:")
        print("-"*50)
        print(text_data if text_data else "[Media file processed but returned empty strings]")
        print("-"*50)
    except Exception as err:
        print(f"\n❌ Pipeline failed during test execution: {err}")

if __name__ == "__main__":
    verify_pipeline()