import json

with open('C:/Users/PC/Documents/ARIN/ARIN-Climate-DSS/frontend/public/kenya-counties.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

min_x, max_x = float('inf'), float('-inf')
min_y, max_y = float('inf'), float('-inf')

for feature in data['features']:
    geom = feature['geometry']
    if geom['type'] == 'Polygon':
        polys = [geom['coordinates']]
    elif geom['type'] == 'MultiPolygon':
        polys = geom['coordinates']
    else:
        continue

    for poly in polys:
        for ring in poly:
            for coord in ring:
                x, y = coord[0], coord[1]
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

print(f"Bounds: Longitude {min_x} to {max_x}, Latitude {min_y} to {max_y}")
print(f"Center: Longitude {(min_x + max_x)/2}, Latitude {(min_y + max_y)/2}")
