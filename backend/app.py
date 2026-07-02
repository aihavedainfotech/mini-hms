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

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

from models.patient_model import Patient
from models.appointment_model import Appointment
from models.user_model import User
from models.doctor_model import Doctor
from models.staff_model import Staff

with app.app_context():
    db.create_all()
    
    # Seed initial users if they don't exist
    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        
    if not User.query.filter_by(username="staff").first():
        staff = User(username="staff", role="staff")
        staff.set_password("staff123")
        db.session.add(staff)
        
    db.session.commit()

@app.route("/")
def home():
    return {"message": "Mini HMS API Running"}

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        return jsonify({
            "message": "Login successful",
            "username": user.username,
            "role": user.role
        }), 200

    return jsonify({"message": "Invalid username or password"}), 401

@app.route("/appointments", methods=["POST", "OPTIONS"])
def create_appointment():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()

        # Look up existing patient by first+last name, or by phone as fallback
        patient = Patient.query.filter(
            Patient.first_name.ilike(data["first_name"]),
            Patient.last_name.ilike(data.get("last_name", ""))
        ).first()

        if not patient and data.get("phone"):
            patient = Patient.query.filter_by(phone=data["phone"]).first()

        # If still not found, create a new patient record
        if not patient:
            patient = Patient(
                first_name=data["first_name"],
                last_name=data.get("last_name"),
                phone=data["phone"],
                gender=data.get("gender")
            )
            db.session.add(patient)
            db.session.commit()

        # Parse date — handle both "2026-06-10T16:25" and "2026-06-10 16:25:00"
        raw_date = data["appointment_date"].replace("T", " ").strip()
        apt_date = None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
            try:
                apt_date = datetime.strptime(raw_date, fmt)
                break
            except ValueError:
                continue

        if not apt_date:
            return jsonify({"message": "Invalid date format."}), 400

        appointment = Appointment(
            patient_id=patient.patient_id,
            appointment_date=apt_date,
            reason=data.get("reason"),
            doctor_id=data.get("doctor_id"),
            doctor_name=data.get("doctor_name")
        )

        db.session.add(appointment)
        db.session.commit()

        return jsonify({
            "message": "Appointment created successfully",
            "patient_id": patient.patient_id,
            "appointment_id": appointment.appointment_id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating appointment: {e}")
        return jsonify({"message": str(e)}), 500

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard_data():
    patients = Patient.query.all()
    appointments = Appointment.query.all()
    
    total_patients = len(patients)
    todays_appointments = len([a for a in appointments if a.appointment_date.date() == datetime.today().date()])
    
    # Recent schedule
    recent_schedule = []
    for a in Appointment.query.order_by(Appointment.appointment_date.desc()).limit(5).all():
        p = Patient.query.get(a.patient_id)
        recent_schedule.append({
            "time": a.appointment_date.strftime("%H:%M"),
            "name": f"{p.first_name} {p.last_name or ''}".strip(),
            "dept": "General OP",
            "status": a.status
        })

    # All patients
    patient_list = []
    for p in patients:
        patient_list.append({
            "id": f"PID-{p.patient_id:05d}",
            "name": f"{p.first_name} {p.last_name or ''}".strip(),
            "gender": p.gender or "U",
            "phone": p.phone,
            "status": "Active"
        })
        
    # All appointments
    appointment_list = []
    completed_apts = 0
    cancelled_apts = 0
    for a in appointments:
        p = Patient.query.get(a.patient_id)
        # Get fee from the assigned doctor
        fee = None
        if a.doctor_id:
            doc = Doctor.query.get(a.doctor_id)
            if doc and doc.appointment_fee:
                fee = float(doc.appointment_fee)
        appointment_list.append({
            "id": a.appointment_id,
            "patient_id": f"PID-{p.patient_id:05d}",
            "time": a.appointment_date.strftime("%d %b %H:%M"),
            "patient": f"{p.first_name} {p.last_name or ''}".strip(),
            "doctor": a.doctor_name or "Unassigned",
            "dept": "General OP",
            "fee": fee,
            "status": a.status,
            "diagnosis": a.diagnosis,
            "prescription": a.prescription
        })
        if a.status.lower() == "completed":
            completed_apts += 1
        elif a.status.lower() == "cancelled":
            cancelled_apts += 1

    # Revenue: sum appointment_fee of assigned doctor for all completed appointments
    total_revenue = 0.0
    for a in appointments:
        if a.status.lower() == "completed" and a.doctor_id:
            doc = Doctor.query.get(a.doctor_id)
            if doc and doc.appointment_fee:
                total_revenue += float(doc.appointment_fee)

    all_doctors = Doctor.query.all()
    all_staff = Staff.query.all()
    return jsonify({
        "stats": {
            "total_patients": total_patients,
            "todays_appointments": todays_appointments,
            "completed_appointments": completed_apts,
            "cancelled_appointments": cancelled_apts,
            "total_revenue": total_revenue
        },
        "recent_schedule": recent_schedule,
        "patients": patient_list,
        "appointments": appointment_list,
        "doctors": [
            {
                "id": f"DOC-{d.doctor_id:03d}",
                "name": d.full_name,
                "department": d.department,
                "qualifications": d.qualifications,
                "experience": d.experience_years,
                "status": d.status,
                "appointment_fee": float(d.appointment_fee) if d.appointment_fee else 0
            } for d in all_doctors
        ],
        "staff": [
            {
                "id": f"STF-{s.staff_id:03d}",
                "name": s.full_name,
                "role": s.role,
                "department": s.department,
                "shift": s.shift,
                "phone": s.phone,
                "status": s.status
            } for s in all_staff
        ]
    })

@app.route("/api/doctors", methods=["POST"])
def add_doctor():
    data = request.get_json()
    if not data or not data.get("full_name"):
        return jsonify({"message": "Doctor name is required"}), 400
        
    doctor = Doctor(
        full_name=data["full_name"],
        department=data.get("department", "General"),
        qualifications=data.get("qualifications", ""),
        experience_years=int(data.get("experience_years", 0)),
        status=data.get("status", "On duty"),
        appointment_fee=float(data.get("appointment_fee", 0))
    )
    
    db.session.add(doctor)
    db.session.commit()
    
    return jsonify({"message": "Doctor added successfully", "doctor_id": doctor.doctor_id}), 201

@app.route("/api/staff", methods=["POST", "OPTIONS"])
def add_staff():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    data = request.get_json()
    if not data or not data.get("full_name"):
        return jsonify({"message": "Staff name is required"}), 400
        
    staff = Staff(
        full_name=data["full_name"],
        role=data.get("role", "Staff"),
        department=data.get("department", "General"),
        shift=data.get("shift", "General Shift"),
        phone=data.get("phone", ""),
        status=data.get("status", "On duty")
    )
    
    db.session.add(staff)
    db.session.commit()
    
    return jsonify({"message": "Staff added successfully", "staff_id": staff.staff_id}), 201

import json

@app.route("/api/appointments/<int:apt_id>/complete", methods=["PATCH", "OPTIONS"])
def complete_appointment(apt_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        data = request.get_json() or {}
        appointment = Appointment.query.get(apt_id)
        if not appointment:
            return jsonify({"message": "Appointment not found"}), 404
            
        appointment.status = "Completed"
        appointment.diagnosis = data.get("diagnosis", "")
        
        prescription_data = data.get("prescription", [])
        if isinstance(prescription_data, list):
            appointment.prescription = json.dumps(prescription_data)
        else:
            appointment.prescription = prescription_data
            
        db.session.commit()
        return jsonify({"message": "Appointment marked as completed"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

if __name__ == "__main__":
    print(app.url_map)
    print(app.config["SQLALCHEMY_DATABASE_URI"])
    app.run(debug=True)