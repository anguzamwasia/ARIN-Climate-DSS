import requests
try:
    r = requests.post("http://localhost:8000/chat", json={"question": "What are the specific climate vulnerabilities?"})
    print(r.json())
except Exception as e:
    print(e)
