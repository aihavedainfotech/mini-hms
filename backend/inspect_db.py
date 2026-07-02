import os
from sqlalchemy import create_engine, inspect

database_url = "postgresql://neondb_owner:npg_41yNZfrcYICV@ep-gentle-sun-aodt9lju-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
engine = create_engine(database_url)
inspector = inspect(engine)

for table_name in inspector.get_table_names():
    print(f"Table: {table_name}")
    for column in inspector.get_columns(table_name):
        print(f"  - {column['name']} ({column['type']})")
