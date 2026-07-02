document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');
    const messageBox = document.getElementById('messageBox');

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Reset message
    messageBox.className = 'message-container';
    messageBox.style.display = 'none';

    // Disable button and show loading state
    const originalBtnText = loginBtn.textContent;
    loginBtn.textContent = 'Signing In...';
    loginBtn.disabled = true;

    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            messageBox.textContent = `Welcome back, ${data.username}! Role: ${data.role}`;
            messageBox.className = 'message-container message-success';
            messageBox.style.display = 'block';
            
            // Redirect to the admin dashboard after successful login
            setTimeout(() => {
                window.location.href = 'dashboard.html';
                loginBtn.textContent = 'Success!';
            }, 1000);
        } else {
            messageBox.textContent = data.message || 'Login failed. Please try again.';
            messageBox.className = 'message-container message-error';
            messageBox.style.display = 'block';
            loginBtn.textContent = originalBtnText;
            loginBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error during login:', error);
        messageBox.textContent = 'A network error occurred. Please try again later.';
        messageBox.className = 'message-container message-error';
        messageBox.style.display = 'block';
        loginBtn.textContent = originalBtnText;
        loginBtn.disabled = false;
    }
});
