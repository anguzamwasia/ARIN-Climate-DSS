import json

with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print first 5 coords of the first polygon
print(data['features'][0]['geometry']['coordinates'][0][0][:5])
