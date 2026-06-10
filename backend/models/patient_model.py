from config.db import db

class Patient(db.Model):
    __tablename__ = "patients"

    patient_id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))

    phone = db.Column(
        db.String(15),
        unique=True,
        nullable=False
    )

    gender = db.Column(db.String(20))
    dob = db.Column(db.Date)

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )