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

    context_text = ""
    source_titles = []

    # 1. DIRECT DOCUMENT MATCHING: Check if user asked for a specific document by name
    db = SessionLocal()
    try:
        for db_doc in db.query(Document).all():
            if db_doc.title:
                clean_title = db_doc.title.lower().replace(".pdf", "").replace(".docx", "").replace(".csv", "").strip()
                if clean_title and len(clean_title) > 3 and clean_title in req.question.lower():
                    doc_text = db_doc.content_text or db_doc.body or ""
                    if doc_text:
                        disp_title = re.sub(r'(?i)\.(docx|pdf|csv|xlsx|mp4|mp3|wav|m4a|txt)$', '', db_doc.title).strip()
                        context_text += f"\n--- {disp_title} ---\n{doc_text[:20000]}\n"
                        doc_url = db_doc.url or db_doc.file_url or "#"
                        doc_url = db_doc.url or db_doc.file_url or "#"
                        if not any(s["title"] == disp_title for s in source_titles):
                            source_titles.append({"title": disp_title, "url": doc_url})
                            
        # Also check approved blogs for direct matching
        from sqlalchemy import text
        approved_blogs = db.execute(text("SELECT * FROM blogs WHERE status = 'approved'")).mappings().all()
        for blog in approved_blogs:
            if blog.get('title'):
                clean_title = str(blog['title']).lower().strip()
                if clean_title and len(clean_title) > 3 and clean_title in req.question.lower():
                    blog_text = f"{blog.get('summary', '')} {blog.get('background', '')} {blog.get('findings', '')} {blog.get('implications', '')} {blog.get('narrative', '')} {blog.get('impact', '')}"
                    if blog_text.strip():
                        context_text += f"\n--- [User Blog] {blog['title']} ---\n{blog_text[:15000]}\n"
                        if not any(s["title"] == blog['title'] for s in source_titles):
                            source_titles.append({"title": str(blog['title']), "url": "/blogs"})
                            
    finally:
        db.close()

    # 2. SEMANTIC SEARCH: Query ChromaDB for top 40 semantically similar documents
    results = collection.query(
        query_texts=[req.question],
        n_results=40
    )
    
    if results and "documents" in results and results["documents"] and len(results["documents"][0]) > 0:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else []
        db = SessionLocal()
        try:
            for i, doc in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                title = meta.get("title", f"Document {i+1}")
                clean_title = re.sub(r'(?i)(\s*[:-]\s*Sequence\s*\d+.*)', '', title).strip()
                # Remove file extensions for cleaner citations
                clean_title = re.sub(r'(?i)\.(docx|pdf|csv|xlsx|mp4|mp3|wav|m4a|txt)$', '', clean_title).strip()
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
    elif not context_text:
        return {
            "answer": "I don't have any training data loaded yet! Please run the data embedding script.",
            "sources": []
        }
    
    try:
        client = OpenAI(api_key=api_key)
        
        prompt = f"""
You are the ARIN Climate DSS AI Assistant, an expert on African climate policy, vulnerabilities, and community insights.
Use the provided document context below—which includes community transcriptions, regional reports, national datasets, and admin-uploaded research papers—to inform your answer.

CRITICAL INSTRUCTIONS:
1. PROVIDE A COMPREHENSIVE AND DETAILED ANSWER. Synthesize information from all the provided documents to give a rich, thorough response. You can write as much information as needed, unless the user explicitly restricts you (e.g., 'give me 2 points' or 'one paragraph').
2. RESTRICT YOUR ANSWER DIRECTLY TO THE USER'S QUESTION. Do not bring up incentives, communities, or unrelated policies unless they are a direct answer to the user's prompt. 
3. ENSURE GEOGRAPHIC ACCURACY. If the user asks about a specific region (e.g., East Africa), filter the context carefully. Do not include countries outside that region (e.g., Mozambique is in Southern Africa) even if they appear in the retrieved context.
4. When giving detailed information, explicitly mention the specific **regions, counties, or areas of study** where the research or field data was collected.
5. YOU MUST PROVIDE INLINE CITATIONS. The number of citations should scale with the amount of information provided, but DO NOT exceed 6 citations total. Pick the most critical facts from the context and append a citation using brackets like [Source: Document Title].
6. BE HONEST ABOUT DATA ABSENCE. If the user asks about a specific type of data (e.g., 'field submissions' or 'Kobo surveys') and none of the provided context documents are actually field surveys, explicitly state that there are no field submissions currently available, rather than trying to pass off policy reports as field submissions.
7. If the context doesn't contain the full specifics, seamlessly integrate your general knowledge about climate change in Africa.

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
                    
        answer_content = response.choices[0].message.content
        
        # Auto-Learn / Dynamic Retraining Memory:
        # Embed user question & AI synthesized insight into ChromaDB so the chatbot continuously learns from past interactions
        if answer_content and len(answer_content) > 50 and "I don't have" not in answer_content:
            try:
                import uuid
                qa_id = f"qa_{uuid.uuid4().hex[:8]}"
                qa_text = f"Prior Inquiry: {req.question}\nSynthesized Knowledge & Insight: {answer_content[:2000]}"
                collection.upsert(
                    documents=[qa_text],
                    metadatas=[{
                        "title": f"Learned Insight: {req.question[:50]}",
                        "source": "ARIN AI Memory",
                        "country": "Africa (Global)"
                    }],
                    ids=[qa_id]
                )
            except Exception as learn_err:
                print(f"Auto-learning embedding error: {learn_err}")
        
        # Filter sources to only include those actually cited in the LLM's answer
        used_sources = []
        for s in source_titles:
            # Also check if part of the title is in the answer in case LLM slightly altered it
            title_words = s["title"].split()
            if s["title"] in answer_content or (len(title_words) > 3 and " ".join(title_words[:4]) in answer_content):
                used_sources.append(s)
                
        return {"answer": answer_content, "sources": used_sources}
    except Exception as e:
        import traceback
        err_trace = traceback.format_exc()
        print(f"OpenAI API Error: {e}\n{err_trace}")
        return {"answer": "Sorry, I ran into an error trying to process that with the AI model. (The API might be experiencing heavy load. Please wait 10 seconds and try again).", "sources": []}
