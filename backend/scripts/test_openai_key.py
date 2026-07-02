import os
from dotenv import load_dotenv
from openai import OpenAI

def test_key():
    print("========================================")
    print("      OPENAI API KEY DIAGNOSTIC         ")
    print("========================================")
    
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("[-] ERROR: No OPENAI_API_KEY found in the .env file!")
        return

    print(f"[*] Found API Key starting with: {api_key[:8]}...\n")
    print("[*] Contacting OpenAI servers to verify billing status...")
    
    client = OpenAI(
        api_key=api_key,
        timeout=5.0,
        max_retries=0
    )
    
    try:
        # We request a tiny 1-token response just to test authorization and quota
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{'role': 'user', 'content': 'Hello'}],
            max_tokens=1
        )
        print("\n[+] SUCCESS: Your OpenAI API key is ACTIVE and has prepaid credits!")
        
    except Exception as e:
        error_msg = str(e).lower()
        if 'insufficient_quota' in error_msg or 'quota' in error_msg or 'billing' in error_msg:
            print("\n[-] FAILED: Insufficient Quota (Error 429).")
            print("    -> You have run out of credits or need to set up billing.")
            print("    -> Please visit: https://platform.openai.com/account/billing")
        elif 'invalid_api_key' in error_msg or 'incorrect api key' in error_msg:
            print("\n[-] FAILED: Invalid API Key (Error 401).")
            print("    -> The key is formatted incorrectly or does not exist.")
        else:
            print(f"\n[-] ERROR: {e}")
            
    print("========================================")

if __name__ == "__main__":
    test_key()
