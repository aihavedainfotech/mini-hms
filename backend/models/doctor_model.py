from config.db import db

class Doctor(db.Model):
    __tablename__ = "doctors"

    doctor_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    qualifications = db.Column(db.String(100))
    experience_years = db.Column(db.Integer)
    status = db.Column(db.String(20), default="On duty")
    appointment_fee = db.Column(db.Numeric(10, 2), default=0.0)
