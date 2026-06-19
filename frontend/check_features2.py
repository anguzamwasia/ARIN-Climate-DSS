import json

with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

for i, feature in enumerate(data['features']):
    print(i, feature['properties']['shapeName'], len(feature['geometry']['coordinates'][0][0]))
