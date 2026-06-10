from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from config import Config
from config.db import db
from sqlalchemy import text

print("APP FILE LOADED")
app = Flask(__name__)

app.config.from_object(Config)

db.init_app(app)

CORS(app)

from models.patient_model import Patient
from models.appointment_model import Appointment

with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return {"message": "Mini HMS API Running"}

@app.route("/appointments", methods=["POST"])
def create_appointment():

    data =request.get_json()

    patient = Patient.query.filter_by(
        phone=data["phone"]
    ).first()

    if not patient:

        patient = Patient(
            first_name=data["first_name"],
            last_name=data.get("last_name"),
            phone=data["phone"],
            gender=data.get("gender")
        )

        db.session.add(patient)
        db.session.commit()

    appointment = Appointment(
        patient_id=patient.patient_id,
        appointment_date=datetime.strptime(
            data["appointment_date"],
            "%Y-%m-%d %H:%M:%S"
        ),
        reason=data.get("reason")
    )

    db.session.add(appointment)
    db.session.commit()

    return jsonify({
        "message": "Appointment created successfully",
        "patient_id": patient.patient_id,
        "appointment_id": appointment.appointment_id
    }), 201

if __name__ == "__main__":
    print(app.url_map)
    print(app.config["SQLALCHEMY_DATABASE_URI"])
    app.run(debug=True)