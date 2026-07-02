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
    apts = Appointment.query.all()
    completed_apts = [a for a in apts if a.status.lower() == 'completed']
    print(f"Total Completed Appointments: {len(completed_apts)}")
    
    pat_ids = set([a.patient_id for a in completed_apts])
    print(f"Total Unique Patients with Completed Appointments: {len(pat_ids)}")
    print(f"Patient IDs: {pat_ids}")
    
    all_pats = Patient.query.all()
    print(f"Total Patients in DB: {len(all_pats)}")
