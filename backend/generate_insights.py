import os
import json
import google.generativeai as genai
from app.database import SessionLocal
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No GEMINI_API_KEY found.")
    exit(1)
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

db = SessionLocal()

# Get all WHISPER documents
docs = db.execute(text("SELECT id, title, content_text FROM documents WHERE source = 'WHISPER'")).mappings().fetchall()

for doc in docs:
    print(f"Processing ID {doc['id']}: {doc['title']}")
    if not doc['content_text']:
        continue
    
    prompt = f"""
    Analyze the following transcript from a video/audio recording.
    1. Identify a 2-3 word main topic for the recording.
    2. Extract a 1-2 sentence main insight or summary.
    
    Return the result strictly as a valid JSON object:
    {{
        "topic": "...",
        "insights": "..."
    }}
    
    Transcript:
    {doc['content_text']}
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean up markdown code blocks if present
        text_resp = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text_resp)
        
        topic = data.get("topic", "Community Insight")
        insights = data.get("insights", "No insights generated.")
        
        db.execute(text("UPDATE documents SET type = :topic, body = :insights WHERE id = :id"), {
            "topic": topic,
            "insights": insights,
            "id": doc['id']
        })
        db.commit()
        print(f"  -> Topic: {topic}")
        print(f"  -> Insights: {insights}")
        
    except Exception as e:
        print(f"Failed to process ID {doc['id']}: {e}")

print("Done updating insights!")
