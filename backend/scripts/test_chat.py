import os
from dotenv import load_dotenv
import chromadb
import google.genai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    collection = chroma_client.get_or_create_collection(name="climate_docs")

    question = "What are the specific climate vulnerabilities facing agriculture in the coastal counties?"
    results = collection.query(
        query_texts=[question],
        n_results=5
    )
    
    context_text = ""
    source_titles = []
    
    if results and "documents" in results and results["documents"] and len(results["documents"][0]) > 0:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if "metadatas" in results and results["metadatas"] else []
        for i, doc in enumerate(docs):
            meta = metas[i] if i < len(metas) else {}
            title = meta.get("title", f"Document {i+1}")
            source_titles.append(title)
            context_text += f"\n--- {title} ---\n{doc}\n"
            
    print("Context length:", len(context_text))

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Context:
    {context_text}
    User Question: {question}
    """
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    print("Response:", response.text)

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
