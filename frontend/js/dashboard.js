const pageNames = {
  dashboard: 'Dashboard',
  patients: 'Patient records',
  appointments: 'Appointments',
  doctors: 'Doctor management',
  staff: 'Staff management',
  billing: 'Billing',
  expenses: 'Expense management',
  reports: 'Reports'
};

const d = new Date();
document.getElementById('topbar-date').textContent = d.toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    const p = el.dataset.page;
    if (!p) return;
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.getElementById('page-' + p).classList.add('active');
    document.getElementById('page-title').textContent = pageNames[p];
  });
});

function showPage(p) {
  document.querySelectorAll('.nav-item').forEach(x => {
    x.classList.remove('active');
    if (x.dataset.page === p) x.classList.add('active');
  });
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  document.getElementById('page-title').textContent = pageNames[p];
}

const colors = ['#185FA5', '#0F6E56', '#993C1D', '#533AB7', '#085041', '#993556'];

// Charts and Data (Currently Empty, Ready for API Integration)

async function loadDashboardData() {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/dashboard');
        const data = await res.json();
        
        window.dashboardData = data;
        
        // Overview Stats
        const stats = data.stats;
        document.getElementById('dash-patients').textContent = stats.total_patients;
        document.getElementById('badge-patients').textContent = stats.total_patients;
        document.getElementById('dash-appointments').textContent = stats.todays_appointments;
        const rev = stats.total_revenue || 0;
        const dashRev = document.getElementById('dash-revenue');
        if (dashRev) dashRev.textContent = '₹' + rev.toLocaleString('en-IN', {minimumFractionDigits: 0});
        
        // Appointments Stats
        document.getElementById('apt-total').textContent = stats.todays_appointments;
        document.getElementById('apt-completed').textContent = stats.completed_appointments;
        document.getElementById('apt-cancelled').textContent = stats.cancelled_appointments;
        
        // Recent Schedule (Dashboard)
        const schedList = document.getElementById('dashboard-schedule-list');
        if (data.recent_schedule && data.recent_schedule.length > 0) {
            schedList.innerHTML = '';
            data.recent_schedule.forEach(a => {
                let badgeClass = a.status.toLowerCase() === 'completed' ? 'success' : 'info';
                schedList.innerHTML += `
                <div class="sched-row">
                    <div class="avatar-sm avatar-a">${a.name.substring(0, 2).toUpperCase()}</div>
                    <div class="sched-time">${a.time}</div>
                    <div class="sched-info">
                        <div class="sched-name">${a.name}</div>
                        <div class="sched-dept">${a.dept}</div>
                    </div>
                    <span class="badge badge-${badgeClass}">${a.status}</span>
                </div>`;
            });
        }
        
        // Patients Table
        const patBody = document.getElementById('patients-table-body');
        const patEmpty = document.getElementById('patients-empty');
        if (data.patients && data.patients.length > 0) {
            patEmpty.style.display = 'none';
            patBody.innerHTML = '';
            
            let displayedPatients = 0;
            
            data.patients.forEach(p => {
                const patientApts = (data.appointments || []).filter(a => a.patient_id === p.id && a.status.toLowerCase() === 'completed');
                
                // Only show patients who have at least one completed appointment
                if (patientApts.length === 0) return;
                
                displayedPatients++;
                
                patientApts.sort((a, b) => b.id - a.id);
                const recentApt = patientApts[0];
                const recentDiagnosis = recentApt && recentApt.diagnosis ? recentApt.diagnosis : '--';
                const shortDiag = recentDiagnosis.length > 30 ? recentDiagnosis.substring(0, 30) + '...' : recentDiagnosis;
                
                patBody.innerHTML += `
                <tr class="patient-row" data-id="${p.id.toLowerCase()}" data-name="${p.name.toLowerCase()}" data-phone="${(p.phone||'').toLowerCase()}">
                    <td style="color:var(--text-tertiary); font-weight: 500;">${p.id}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px">
                            <div class="avatar-sm avatar-b">${p.name.substring(0, 2).toUpperCase()}</div>
                            ${p.name}
                        </div>
                    </td>
                    <td>${p.gender || 'U'}</td>
                    <td>${p.phone || '--'}</td>
                    <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color:var(--text-secondary);" title="${recentDiagnosis.replace(/"/g, '&quot;')}">${shortDiag}</td>
                    <td><span class="badge badge-success">${p.status}</span></td>
                    <td><button class="btn" style="padding:4px 8px;font-size:11px" onclick="viewPatientDiagnosis('${p.id}')"><i class="ti ti-eye"></i></button></td>
                </tr>`;
            });
            
            if (displayedPatients === 0) {
                patBody.innerHTML = '';
                patEmpty.style.display = 'block';
                patEmpty.textContent = 'No patients with completed appointments found.';
            }
        }
        
        // Appointments Table
        const aptBody = document.getElementById('appointments-table-body');
        const aptEmpty = document.getElementById('appointments-empty');
        if (data.appointments && data.appointments.length > 0) {
            aptEmpty.style.display = 'none';
            aptBody.innerHTML = '';
            data.appointments.forEach(a => {
                let badgeClass = a.status.toLowerCase() === 'completed' ? 'success' : (a.status.toLowerCase() === 'cancelled' ? 'danger' : 'warning');
                const isCompleted = a.status.toLowerCase() === 'completed';
                const feeDisplay = a.fee ? '₹' + parseFloat(a.fee).toLocaleString('en-IN') : '--';
                const completeBtn = isCompleted
                    ? `<span style="font-size:11px;color:var(--success-text);font-weight:500">✓ Done</span>`
                    : `<button class="btn btn-primary" style="padding:4px 10px;font-size:11px" onclick="completeAppointment(${a.id})"><i class="ti ti-check"></i> Complete</button>`;
                aptBody.innerHTML += `
                <tr>
                    <td>${a.time}</td>
                    <td>${a.patient}</td>
                    <td>${a.doctor}</td>
                    <td>${a.dept}</td>
                    <td>OP</td>
                    <td>${feeDisplay}</td>
                    <td><span class="badge badge-${badgeClass}">${a.status}</span></td>
                    <td>${completeBtn}</td>
                </tr>`;
            });
        }
        
        // Doctors Grid
        const docGrid = document.getElementById('doctors-grid');
        const docEmpty = document.getElementById('doctors-empty');
        const docSelect = document.getElementById('appointmentDoctor');
        if (docSelect) {
            docSelect.innerHTML = '<option value="">-- Select a Doctor (Optional) --</option>';
        }

        if (data.doctors && data.doctors.length > 0) {
            docEmpty.style.display = 'none';
            docGrid.innerHTML = '';
            
            // Re-use avatar colors based on index
            const avatarColors = ['avatar-a', 'avatar-b', 'avatar-c', 'avatar-d', 'avatar-e', 'avatar-f'];
            
            data.doctors.forEach((d, index) => {
                if (docSelect) {
                    const opt = document.createElement('option');
                    opt.value = parseInt(d.id.split('-')[1], 10);
                    opt.textContent = d.name;
                    docSelect.appendChild(opt);
                }
                let badgeClass = d.status.toLowerCase() === 'on duty' ? 'success' : (d.status.toLowerCase() === 'on leave' ? 'danger' : 'gray');
                let avatarClass = avatarColors[index % avatarColors.length];
                let initials = d.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                docGrid.innerHTML += `
                <div class="card" style="margin-bottom:0">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                    <div class="avatar-sm ${avatarClass}" style="width:38px;height:38px;font-size:13px">${initials}</div>
                    <div>
                      <div style="font-size:13px;font-weight:500">${d.name}</div>
                      <div style="font-size:11px;color:var(--text-tertiary)">${d.department}</div>
                    </div>
                    <span class="badge badge-${badgeClass}" style="margin-left:auto">${d.status}</span>
                  </div>
                  <div class="stat-row"><span style="font-size:12px">${d.qualifications || 'N/A'}</span></div>
                  <div class="stat-row">
                    <span style="font-size:12px">Exp: ${d.experience} yrs</span>
                    <span style="font-size:12px;color:var(--text-tertiary)">ID: ${d.id}</span>
                  </div>
                  <div class="stat-row" style="border:none">
                    <span style="font-size:12px;font-weight:600;color:var(--success-text)">Fee: ₹${d.appointment_fee || 0}</span>
                  </div>
                  <div style="margin-top:8px;display:flex;gap:6px">
                    <button class="btn" style="font-size:11px;padding:4px 8px;flex:1">Schedule</button>
                    <button class="btn" style="font-size:11px;padding:4px 8px;flex:1">Profile</button>
                  </div>
                </div>`;
            });
        }
        
        // Staff Table & Stats
        const staffBody = document.getElementById('staff-table-body');
        const staffEmpty = document.getElementById('staff-empty');
        if (data.staff) {
            document.getElementById('staff-total').textContent = data.staff.length;
            const onDutyCount = data.staff.filter(s => s.status.toLowerCase() === 'on duty').length;
            const onLeaveCount = data.staff.filter(s => s.status.toLowerCase() === 'on leave').length;
            document.getElementById('staff-onduty').textContent = onDutyCount;
            document.getElementById('staff-onleave').textContent = onLeaveCount;

            if (data.staff.length > 0) {
                staffEmpty.style.display = 'none';
                staffBody.innerHTML = '';
                data.staff.forEach(s => {
                    let badgeClass = s.status.toLowerCase() === 'on duty' ? 'success' : (s.status.toLowerCase() === 'on leave' ? 'warning' : 'gray');
                    staffBody.innerHTML += `
                    <tr>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>${s.role}</td>
                        <td>${s.department}</td>
                        <td>${s.shift}</td>
                        <td>${s.phone || '--'}</td>
                        <td><span class="badge badge-${badgeClass}">${s.status}</span></td>
                        <td><button class="btn" style="padding:4px 8px;font-size:11px"><i class="ti ti-edit"></i></button></td>
                    </tr>`;
                });
            } else {
                staffEmpty.style.display = 'block';
                staffBody.innerHTML = '';
            }
        }
    } catch (e) {
        console.error("Failed to load dashboard data", e);
    }
}

// Load data immediately
loadDashboardData();

// TODO: Initialize charts when real analytics data is available
const rc = document.getElementById('rev-chart');
if (rc) { rc.innerHTML = '<div style="color:var(--text-tertiary); font-size:12px; margin-top:20px;">No revenue data available.</div>'; }

// Modal Logic
function openAppointmentModal() {
    document.getElementById('appointmentModal').classList.add('active');
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').classList.remove('active');
    document.getElementById('appointmentForm').reset();
}

async function submitAppointment() {
    const form = document.getElementById('appointmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const docSelect = document.getElementById('appointmentDoctor');
    const doctorId = docSelect && docSelect.value ? parseInt(docSelect.value, 10) : null;
    const doctorName = docSelect && docSelect.value ? docSelect.options[docSelect.selectedIndex].text : null;

    const payload = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        gender: document.getElementById('gender').value,
        appointment_date: document.getElementById('appointmentDate').value,
        reason: document.getElementById('reason').value,
        doctor_id: doctorId,
        doctor_name: doctorName
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeAppointmentModal();
            loadDashboardData(); // Refresh the dashboard tables instantly
        } else {
            const error = await response.json();
            alert('Failed to book appointment: ' + (error.message || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error submitting appointment', e);
        alert('An error occurred. Please check the console.');
    }
}

// Doctor Modal Logic
function openDoctorModal() {
    document.getElementById('doctorModal').classList.add('active');
}

function closeDoctorModal() {
    document.getElementById('doctorModal').classList.remove('active');
    document.getElementById('doctorForm').reset();
}

let currentPrescription = [];

function completeAppointment(aptId) {
    document.getElementById('completeAptId').value = aptId;
    document.getElementById('completeForm').reset();
    currentPrescription = [];
    renderPrescriptionList();
    document.getElementById('completeModal').classList.add('active');
}

function closeCompleteModal() {
    document.getElementById('completeModal').classList.remove('active');
}

function addMedicine() {
    const name = document.getElementById('medName').value.trim();
    const dosage = document.getElementById('medDosage').value.trim();
    const freq = document.getElementById('medFreq').value.trim();
    const duration = document.getElementById('medDuration').value.trim();
    
    if (!name) {
        alert("Medicine name is required.");
        return;
    }
    
    currentPrescription.push({ name, dosage, freq, duration });
    
    document.getElementById('medName').value = '';
    document.getElementById('medDosage').value = '';
    document.getElementById('medFreq').value = '';
    document.getElementById('medDuration').value = '';
    
    renderPrescriptionList();
}

function removeMedicine(index) {
    currentPrescription.splice(index, 1);
    renderPrescriptionList();
}

function renderPrescriptionList() {
    const tbody = document.getElementById('prescriptionListBody');
    if (currentPrescription.length === 0) {
        tbody.innerHTML = '<tr id="emptyPrescriptionRow"><td colspan="5" style="text-align:center; padding:15px; color:var(--text-tertiary); font-size:12px;">No medicines added yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    currentPrescription.forEach((med, index) => {
        tbody.innerHTML += `
        <tr>
            <td>${med.name}</td>
            <td>${med.dosage}</td>
            <td>${med.freq}</td>
            <td>${med.duration}</td>
            <td><button type="button" class="btn" style="padding:4px 8px;font-size:11px;color:var(--danger-text)" onclick="removeMedicine(${index})"><i class="ti ti-trash"></i></button></td>
        </tr>`;
    });
}

async function submitCompleteAppointment() {
    const form = document.getElementById('completeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const aptId = document.getElementById('completeAptId').value;
    const diagnosis = document.getElementById('diagnosis').value.trim();
    
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/appointments/${aptId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ diagnosis: diagnosis, prescription: currentPrescription })
        });
        if (res.ok) {
            closeCompleteModal();
            loadDashboardData();
        } else {
            const err = await res.json();
            alert('Failed: ' + (err.message || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error completing appointment', e);
        alert('An error occurred. Please check the console.');
    }
}

async function submitDoctor() {
    const form = document.getElementById('doctorForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        full_name: document.getElementById('docName').value,
        department: document.getElementById('docDept').value,
        qualifications: document.getElementById('docQual').value,
        experience_years: document.getElementById('docExp').value || 0,
        status: document.getElementById('docStatus').value,
        appointment_fee: parseFloat(document.getElementById('docFee').value) || 0
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/api/doctors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeDoctorModal();
            loadDashboardData(); // Refresh the dashboard tables instantly
        } else {
            const error = await response.json();
            alert('Failed to add doctor: ' + (error.message || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error submitting doctor', e);
        alert('An error occurred. Please check the console.');
    }
}

// Staff Modal Logic
function openStaffModal() {
    document.getElementById('staffModal').classList.add('active');
}

function closeStaffModal() {
    document.getElementById('staffModal').classList.remove('active');
    document.getElementById('staffForm').reset();
}

async function submitStaff() {
    const form = document.getElementById('staffForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        full_name: document.getElementById('staffName').value,
        role: document.getElementById('staffRole').value,
        department: document.getElementById('staffDept').value,
        shift: document.getElementById('staffShift').value,
        phone: document.getElementById('staffPhone').value,
        status: document.getElementById('staffStatus').value
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            closeStaffModal();
            loadDashboardData();
        } else {
            const error = await response.json();
            alert('Failed to add staff: ' + (error.message || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error submitting staff', e);
        alert('An error occurred. Please check the console.');
    }
}

function viewPatientDiagnosis(patientId) {
    if (!window.dashboardData || !window.dashboardData.appointments) return;
    
    // Find all completed appointments for this patient
    const patientApts = window.dashboardData.appointments.filter(a => a.patient_id === patientId && a.status.toLowerCase() === 'completed');
    
    const container = document.getElementById('diagnosisContentContainer');
    
    if (patientApts.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-tertiary);">No completed appointments found for this patient.</div>';
    } else {
        // Sort by date descending (assuming id correlates with date or just use as is)
        patientApts.sort((a, b) => b.id - a.id);
        
        let html = '';
        patientApts.forEach(apt => {
            html += `<div style="margin-bottom: 20px; border: 1px solid var(--border-light); border-radius: 8px; padding: 15px;">`;
            html += `<div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 8px; margin-bottom: 10px;">`;
            html += `<strong>Date: ${apt.time}</strong>`;
            html += `<span>Doctor: ${apt.doctor}</span>`;
            html += `</div>`;
            html += `<div style="margin-bottom: 10px;">`;
            html += `<strong style="font-size: 13px;">Diagnosis:</strong>`;
            html += `<p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 13px;">${apt.diagnosis || 'No diagnosis recorded.'}</p>`;
            html += `</div>`;
            
            html += `<div><strong style="font-size: 13px;">Prescription:</strong></div>`;
            if (apt.prescription) {
                try {
                    const presList = typeof apt.prescription === 'string' ? JSON.parse(apt.prescription) : apt.prescription;
                    if (Array.isArray(presList) && presList.length > 0) {
                        html += `<table class="tbl" style="margin-top: 5px; margin-bottom: 0;">`;
                        html += `<thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>`;
                        presList.forEach(m => {
                            html += `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.freq}</td><td>${m.duration}</td></tr>`;
                        });
                        html += `</tbody></table>`;
                    } else {
                        html += `<p style="margin: 4px 0 0 0; color: var(--text-tertiary); font-size: 13px;">No medicines prescribed.</p>`;
                    }
                } catch(e) {
                    html += `<p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 13px;">${apt.prescription}</p>`;
                }
            } else {
                html += `<p style="margin: 4px 0 0 0; color: var(--text-tertiary); font-size: 13px;">No medicines prescribed.</p>`;
            }
            html += `</div>`;
        });
        container.innerHTML = html;
    }
    
    document.getElementById('viewDiagnosisModal').classList.add('active');
}

function closeViewDiagnosisModal() {
    document.getElementById('viewDiagnosisModal').classList.remove('active');
}

const db = document.getElementById('dept-bars');
if (db) { db.innerHTML = '<div style="color:var(--text-tertiary); font-size:12px; margin-top:20px;">No department data available.</div>'; }

const eb = document.getElementById('exp-bars');
if (eb) { eb.innerHTML = '<div style="color:var(--text-tertiary); font-size:12px; margin-top:20px;">No expense data available.</div>'; }

const rch = document.getElementById('report-chart');
if (rch) { rch.innerHTML = '<div style="color:var(--text-tertiary); font-size:12px; margin-top:20px;">No report data available.</div>'; }

const drb = document.getElementById('dept-rev');
if (drb) { drb.innerHTML = '<div style="color:var(--text-tertiary); font-size:12px; margin-top:20px;">No department revenue data available.</div>'; }

// Setup Search Listener for Patients
const searchInput = document.getElementById('patientSearchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.patient-row').forEach(row => {
            const id = row.dataset.id || '';
            const name = row.dataset.name || '';
            const phone = row.dataset.phone || '';
            
            if (id.includes(query) || name.includes(query) || phone.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}
