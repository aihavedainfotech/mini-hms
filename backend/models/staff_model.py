from config.db import db
from datetime import datetime

class Staff(db.Model):
    __tablename__ = 'staff'

    staff_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    shift = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(50), default="On duty")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
