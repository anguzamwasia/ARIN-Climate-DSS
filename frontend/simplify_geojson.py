import json

def round_coords(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 3), round(coords[1], 3)]
    return [round_coords(c) for c in coords]

with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

for feature in data['features']:
    geom = feature['geometry']
    if geom:
        geom['coordinates'] = round_coords(geom['coordinates'])

with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'w', encoding='utf-8') as f:
    json.dump(data, f, separators=(',', ':'))
