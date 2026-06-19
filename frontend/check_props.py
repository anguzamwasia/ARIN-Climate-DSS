import json
with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(data['features'][0]['properties'])
