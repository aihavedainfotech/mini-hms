from config.db import db

class Appointment(db.Model):
    __tablename__ = "appointments"

    appointment_id = db.Column(
        db.Integer,
        primary_key=True
    )

    patient_id = db.Column(
        db.Integer,
        db.ForeignKey("patients.patient_id"),
        nullable=False
    )

    appointment_date = db.Column(
        db.DateTime,
        nullable=False
    )

    reason = db.Column(db.Text)

    status = db.Column(
        db.String(20),
        default="Scheduled"
    )