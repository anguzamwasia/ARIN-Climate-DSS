with open("test_table.html", "r", encoding="utf-8") as f:
    text = f.read()
    if "Author" in text:
        print("YES! 'Author' found in HTML.")
        idx = text.find("Author")
        print(text[max(0, idx-100):min(len(text), idx+100)])
    else:
        print("NO! 'Author' NOT found in HTML.")
