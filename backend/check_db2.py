import os
from flask import Flask
from config import Config
from config.db import db
from models.appointment_model import Appointment
from models.patient_model import Patient

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    apts = Appointment.query.filter_by(status='Completed').all()
    
    breakdown = {}
    for a in apts:
        if a.patient_id not in breakdown:
            breakdown[a.patient_id] = []
        breakdown[a.patient_id].append(a.appointment_date.strftime("%Y-%m-%d %H:%M"))
        
    for pid, dates in breakdown.items():
        p = Patient.query.get(pid)
        print(f"Patient PID-{pid:05d} ({p.first_name} {p.last_name or ''}): {len(dates)} visits -> {dates}")
