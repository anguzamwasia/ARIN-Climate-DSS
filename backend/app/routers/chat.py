from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
import chromadb
from openai import OpenAI
import re

router = APIRouter()

class ChatRequest(BaseModel):
    question: str

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
        for i, doc in enumerate(docs):
            meta = metas[i] if i < len(metas) else {}
            title = meta.get("title", f"Document {i+1}")
            clean_title = re.sub(r'(?i)(\s*[:-]\s*Sequence\s*\d+.*)', '', title).strip()
            source_titles.append(clean_title)
            context_text += f"\n--- {clean_title} ---\n{doc}\n"
    else:
        return {
            "answer": "I don't have any training data loaded yet! Please run the data embedding script.",
            "sources": []
        }
    
    try:
        client = OpenAI(api_key=api_key)
        
        prompt = f"""
You are the ARIN Climate DSS AI Assistant, an expert on African climate policy and vulnerabilities. 
Use the provided document context below to inform your answer. 
If the context doesn't contain the full specifics, seamlessly integrate your general knowledge about climate change in East Africa to provide a comprehensive answer.
You MUST provide inline citations at the end of paragraphs using brackets like [Source: Document Title] when referencing the provided context.

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
        # Deduplicate source titles for the frontend
        unique_sources = list(set(source_titles))
        return {"answer": response.choices[0].message.content, "sources": unique_sources}
    except Exception as e:
        import traceback
        err_trace = traceback.format_exc()
        print(f"OpenAI API Error: {e}\n{err_trace}")
        return {"answer": "Sorry, I ran into an error trying to process that with the AI model. (The API might be experiencing heavy load. Please wait 10 seconds and try again).", "sources": []}
