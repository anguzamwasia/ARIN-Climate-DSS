from bs4 import BeautifulSoup

with open("test_table.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

print("Looking for tables...")
tables = soup.find_all('table')
print(f"Found {len(tables)} tables.")

for i, table in enumerate(tables):
    print(f"\nTable {i}:")
    headers = [th.text.strip() for th in table.find_all('th')]
    print(f"Headers: {headers}")
    
    # Print first 2 rows
    rows = table.find_all('tr')[1:3]
    for row in rows:
        cells = [td.text.strip() for td in row.find_all('td')]
        print(f"Row: {cells}")
        # Look for links in this row
        links = [a.get('href') for a in row.find_all('a', href=True)]
        print(f"Links in row: {links}")
