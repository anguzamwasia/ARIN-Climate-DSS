import requests
import json
from datetime import datetime

url = "https://api.reliefweb.int/v1/reports?appname=arin&query[value]=climate&filter[field]=source.name&filter[value]=UNFCCC&limit=150&profile=full"
r = requests.get(url)
print("ReliefWeb Status:", r.status_code)
data = r.json()
print("ReliefWeb Count:", data.get('totalCount', 0))

# Try a broader search if UNFCCC alone is low
url2 = "https://api.reliefweb.int/v1/reports?appname=arin&query[value]=climate+change+africa&limit=200&profile=full"
r2 = requests.get(url2)
data2 = r2.json()
print("ReliefWeb Broad Count:", data2.get('totalCount', 0))
