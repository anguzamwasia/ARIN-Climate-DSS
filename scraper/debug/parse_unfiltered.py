from bs4 import BeautifulSoup

with open("test_table.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

rows = soup.select("tr")
for row in rows:
    tds = row.select("td")
    if not tds:
        continue
        
    print("-" * 50)
    for i, td in enumerate(tds):
        print(f"Column {i}: {td.text.strip()[:100]}")
