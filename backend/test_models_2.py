import os
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

try:
    print("Testing gemini-3.5-flash...")
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents="Hello",
    )
    print("Success 3.5:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()

try:
    print("Testing gemini-2.0-flash...")
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents="Hello",
    )
    print("Success 2.0:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
