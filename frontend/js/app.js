document.getElementById('appointmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message'; // reset class
    messageDiv.innerText = 'Submitting...';
    messageDiv.style.display = 'block';

    // Format datetime from "YYYY-MM-DDThh:mm" to "YYYY-MM-DD HH:MM:SS"
    const rawDate = document.getElementById('appointmentDate').value;
    const dateObj = new Date(rawDate);
    
    // Ensure padding with zeros
    const pad = (num) => num.toString().padStart(2, '0');
    const formattedDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;

    const data = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        gender: document.getElementById('gender').value,
        appointment_date: formattedDate,
        reason: document.getElementById('reason').value
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.innerText = 'Appointment created successfully!';
            document.getElementById('appointmentForm').reset();
        } else {
            messageDiv.className = 'message error';
            messageDiv.innerText = result.error || 'Failed to create appointment.';
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.innerText = 'Server error. Please ensure the backend is running.';
        console.error('Error:', error);
    }
});
