import os
from flask import Flask
from config import Config
from config.db import db
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE appointments ADD COLUMN diagnosis TEXT;"))
            conn.execute(text("ALTER TABLE appointments ADD COLUMN prescription TEXT;"))
            conn.commit()
            print("Successfully altered table.")
    except Exception as e:
        print(f"Error altering table: {e}")
