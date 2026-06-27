import os
from dotenv import load_dotenv
from openai import OpenAI
import traceback

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

try:
    print("Testing OpenAI GPT-4o-mini...")
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[{"role": "user", "content": "Hello"}],
    )
    print("Success:", response.choices[0].message.content)
except Exception as e:
    print("Error encountered:")
    traceback.print_exc()
