import os
from sqlalchemy import text
from app.database import SessionLocal
from app.services.transcriber import transcribe_community_audio
from app.routers.transcription import save_transcript_to_db

def auto_transcribe_new_media():
    print("Checking for new media in uploads/...")
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        return

    media_files = [f for f in os.listdir(upload_dir) if f.lower().endswith(('.mp4', '.mp3', '.wav', '.m4a'))]
    
    db = SessionLocal()
    try:
        existing = db.execute(text("SELECT file_url FROM documents WHERE source = 'WHISPER' AND file_url IS NOT NULL")).fetchall()
        existing_filenames = {row[0] for row in existing}
        
        for filename in media_files:
            if filename not in existing_filenames:
                print(f"New media found: {filename}. Transcribing...")
                try:
                    transcript = transcribe_community_audio(filename)
                    save_transcript_to_db(filename, transcript)
                    print(f"Successfully transcribed and saved: {filename}")
                except Exception as e:
                    print(f"Error transcribing {filename}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    auto_transcribe_new_media()
