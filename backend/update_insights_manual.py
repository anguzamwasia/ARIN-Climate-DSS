from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

updates = [
    {
        "like_title": "%SDG activity feedback%",
        "topic": "SDG Feedback",
        "insight": "Discussed identifying positive and negative interactions in SDG activities for Kenya."
    },
    {
        "like_title": "%Public Engagement Session%",
        "topic": "Public Engagement",
        "insight": "Dr. Steve Dawney introduced public engagement and research strategies at the University of Southampton."
    },
    {
        "like_title": "%Policy Brief Session%",
        "topic": "Policy Briefs",
        "insight": "Participants shared their experiences transitioning into university life and early policy research."
    },
    {
        "like_title": "%KII RW%",
        "topic": "CIDP Development",
        "insight": "Explored the process of developing the County Integrated Development Plan (CIDP)."
    }
]

for u in updates:
    db.execute(text("UPDATE documents SET type = :topic, body = :insight WHERE source = 'WHISPER' AND title LIKE :like_title"), {
        "topic": u["topic"],
        "insight": u["insight"],
        "like_title": u["like_title"]
    })

db.commit()
print("Successfully updated WHISPER topics and insights!")
