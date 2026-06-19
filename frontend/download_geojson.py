import requests
import json

api_url = 'https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM1/'
print(f'Fetching from {api_url}')
response = requests.get(api_url).json()
download_url = response.get('gjDownloadURL')
print(f'Downloading from {download_url}')
geojson = requests.get(download_url).text
with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'w', encoding='utf-8') as f:
    f.write(geojson)
print('Done!')
