from bs4 import BeautifulSoup

with open("test_table.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

print("TR rows:", len(soup.select("tr")))
print("Articles:", len(soup.select("article")))
print("Views-row:", len(soup.select(".views-row")))
