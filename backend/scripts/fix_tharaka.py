import sqlalchemy
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:password@localhost:5432/arin_dss')
conn = engine.connect()
conn.execute(text("UPDATE documents SET country='Tharaka County' WHERE country='Tharaka-Nithi County'"))
conn.commit()
print("Updated db!")
