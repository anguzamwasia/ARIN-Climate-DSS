import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in .env file.")
    exit(1)

print(f"Connecting to database: {db_url.split('@')[-1]}")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# 1. Update blogs table columns
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='blogs'")
columns = [r[0] for r in cur.fetchall()]

if 'author_email' not in columns:
    print("Adding 'author_email' column to 'blogs' table...")
    cur.execute("ALTER TABLE blogs ADD COLUMN author_email VARCHAR(255);")
    conn.commit()

if 'previous_version' not in columns:
    print("Adding 'previous_version' column to 'blogs' table...")
    cur.execute("ALTER TABLE blogs ADD COLUMN previous_version TEXT;")
    conn.commit()

# 2. Create notifications table if not exists
cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
""")
conn.commit()
print("Notifications table verified/created successfully.")

cur.close()
conn.close()
print("Database schema upgrade v2 completed successfully!")
