from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
import os
import google.genai as genai

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

@router.post("/chat")
def chat_with_data(req: ChatRequest, db: Session = Depends(get_db)):
    if not req.question:
        return {"answer": "No message provided.", "sources": []}
        
    last_user_message = req.question
    
    # Simple search
    keywords = [word for word in last_user_message.split() if len(word) > 3]
    
    conditions = []
    params = {}
    for i, kw in enumerate(keywords[:5]): # max 5 keywords to prevent massive queries
        conditions.append(f"(title ILIKE :kw{i} OR content_text ILIKE :kw{i} OR body ILIKE :kw{i})")
        params[f"kw{i}"] = f"%{kw}%"
        
    where_clause = " OR ".join(conditions) if conditions else "1=1"
    
    query = text(f"""
        SELECT title, source, country, COALESCE(content_text, body) as content 
        FROM documents 
        WHERE {where_clause} 
        LIMIT 5
    """)
    
    results = db.execute(query, params).fetchall()
    
    context_text = ""
    for idx, row in enumerate(results):
        content_excerpt = str(row.content)[:800] if row.content else "No textual content available."
        context_text += f"\n--- Document {idx+1} ---\nTitle: {row.title}\nSource: {row.source}\nCountry: {row.country}\nContent Excerpt: {content_excerpt}\n"

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        doc_titles = [r.title for r in results]
        return {
            "answer": f"I found some related documents ({', '.join(doc_titles) if doc_titles else 'none'}), but I need a `GEMINI_API_KEY` in your `.env` file to read them for you! Please add it and restart the backend.",
            "sources": doc_titles
        }

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
You are the ARIN Climate DSS AI Assistant. Answer the user's question using ONLY the provided document context below.
If the answer is not in the context, politely say you don't have enough data in the repository yet.
You MUST provide inline citations at the end of paragraphs using brackets like [Source: Document Title].

Context:
{context_text}

User Question: {last_user_message}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        # Extract sources from results for the frontend citation chips
        source_titles = [r.title for r in results]
        return {"answer": response.text, "sources": source_titles}
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"answer": "Sorry, I ran into an error trying to process that with the AI model.", "sources": []}
