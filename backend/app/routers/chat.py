from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
import chromadb
from openai import OpenAI
import re
from app.database import SessionLocal
from app.models.document import Document

router = APIRouter()

from app.schemas.chat import ChatRequest, ChatResponse
# Initialize chromadb client once at module level
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="climate_docs")

@router.post("/chat")
def chat_with_data(req: ChatRequest):
    if not req.question:
        return {"answer": "No message provided.", "sources": []}
        
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {
            "answer": "I need a `OPENAI_API_KEY` in your `.env` file to answer your question! Please add it and restart the backend.",
            "sources": []
        }

    # Query ChromaDB for top 10 semantically similar documents
    results = collection.query(
        query_texts=[req.question],
        n_results=10
    )
    
    context_text = ""
    source_titles = []
    
    if results and "documents" in results and results["documents"] and len(results["documents"][0]) > 0:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else []
        db = SessionLocal()
        try:
            for i, doc in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                title = meta.get("title", f"Document {i+1}")
                clean_title = re.sub(r'(?i)(\s*[:-]\s*Sequence\s*\d+.*)', '', title).strip()
                doc_url = "#"
                
                original_id = meta.get("original_id")
                if original_id:
                    db_doc = db.query(Document).filter(Document.id == int(original_id)).first()
                    if db_doc:
                        doc_url = db_doc.url or db_doc.file_url or "#"
                
                if not any(s["title"] == clean_title for s in source_titles):
                    source_titles.append({"title": clean_title, "url": doc_url})
                context_text += f"\n--- {clean_title} ---\n{doc}\n"
        finally:
            db.close()
    else:
        return {
            "answer": "I don't have any training data loaded yet! Please run the data embedding script.",
            "sources": []
        }
    
    try:
        client = OpenAI(api_key=api_key)
        
        prompt = f"""
You are the ARIN Climate DSS AI Assistant, an expert on African climate policy, vulnerabilities, and community insights.
Use the provided document context below—which includes community transcriptions, regional reports, and national datasets—to inform your answer.
When answering, explicitly search the context for and highlight any **incentives** (financial, social, policy-driven, or community-based) mentioned in the community insights or existing reports. Tailor your response to incorporate these perspectives, especially when asked about community views (e.g., "What did the community say about agriculture?").
Additionally, when giving more detailed information, explicitly mention the specific **regions, counties, or areas of study** where the research or field data was collected, if that information is available in the context.
If the context doesn't contain the full specifics, seamlessly integrate your general knowledge about climate change in Africa.
You MUST provide inline citations at the end of paragraphs or sentences using brackets like [Source: Document Title] when referencing the provided context.

Context:
{context_text}

User Question: {req.question}
"""
        import time
        max_retries = 5
        retry_delay = 3
        response = None
        
        for attempt in range(max_retries):
            try:
                response = client.chat.completions.create(
                    model='gpt-4o-mini',
                    messages=[{"role": "user", "content": prompt}],
                )
                break
            except Exception as e:
                if ("503" in str(e) or "429" in str(e)) and attempt < max_retries - 1:
                    print(f"OpenAI API Error (Attempt {attempt+1}/{max_retries}). Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 1.5
                else:
                    raise e
        return {"answer": response.choices[0].message.content, "sources": source_titles}
    except Exception as e:
        import traceback
        err_trace = traceback.format_exc()
        print(f"OpenAI API Error: {e}\n{err_trace}")
        return {"answer": "Sorry, I ran into an error trying to process that with the AI model. (The API might be experiencing heavy load. Please wait 10 seconds and try again).", "sources": []}
