import os
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    client = genai.Client(api_key=api_key)
    print("Testing gemini-1.5-flash...")
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents="Hello",
    )
    print("Success 1.5:", response.text)
except Exception as e:
    print("Error 1.5:", e)

try:
    print("Testing gemini-2.5-flash...")
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Hello",
    )
    print("Success 2.5:", response.text)
except Exception as e:
    print("Error 2.5:", e)
