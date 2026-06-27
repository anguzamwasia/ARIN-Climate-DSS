import os
import chromadb
from sqlalchemy import text
from app.database import SessionLocal

def embed_all_documents():
    print("Connecting to ChromaDB...")
    # Store vectors in a local folder
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    
    # We use the default sentence-transformers embedding function
    collection = chroma_client.get_or_create_collection(name="climate_docs")
    
    print("Fetching documents from Database...")
    db = SessionLocal()
    try:
        query = text("""
            SELECT id, title, source, country, content_text, body
            FROM documents
        """)
        results = db.execute(query).fetchall()
        
        docs = []
        metadatas = []
        ids = []
        
        for row in results:
            doc_id = str(row.id)
            title = row.title or "Untitled"
            source = row.source or "Unknown"
            country = row.country or "Unknown"
            content = row.content_text or row.body or ""
            
            # Embed up to 3000 chars for now to cover abstracts and key text efficiently
            text_to_embed = f"Title: {title}\nSource: {source}\nCountry: {country}\nContent: {content[:3000]}"
            
            docs.append(text_to_embed)
            metadatas.append({
                "title": title,
                "source": source,
                "country": country,
                "original_id": doc_id
            })
            ids.append(f"doc_{doc_id}")
            
        if docs:
            print(f"Embedding {len(docs)} documents... This may take a moment to download the model the first time.")
            batch_size = 100
            for i in range(0, len(docs), batch_size):
                print(f"Processing batch {i} to {i + batch_size}...")
                collection.upsert(
                    documents=docs[i:i+batch_size],
                    metadatas=metadatas[i:i+batch_size],
                    ids=ids[i:i+batch_size]
                )
            print("Successfully embedded all documents!")
        else:
            print("No documents found in the database.")
            
    finally:
        db.close()

if __name__ == "__main__":
    embed_all_documents()
