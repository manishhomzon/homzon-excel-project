// script.js
// Dhyan Dein: Deployment ke baad is URL ko aapke Render API URL se badalna hoga.
const BASE_URL = 'https://homzon-excel-api.onrender.com'; 

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Toggle functionality
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            loginForm.classList.toggle('hidden');
            registerForm.classList.toggle('hidden');
            toggleButton.textContent = loginForm.classList.contains('hidden') ? 'Login' : 'Register Now';
        });
    }
});

/**
 * Handles the Login form submission (Username/Password Check + OTP Verification)
 */
async function handleLogin(event) {
    event.preventDefault(); 

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const otpGroup = document.getElementById('otpGroup');
    const loginButton = document.getElementById('loginButton');

    // Phase 1: Username/Password check
    if (!otpGroup.classList.contains('active-otp')) {
        
        try {
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Login successful! OTP sent for verification (Check server console).');
                
                // Show OTP field
                otpGroup.classList.remove('hidden');
                otpGroup.classList.add('active-otp'); 
                loginButton.textContent = 'Verify OTP & Login';

            } else {
                alert(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Error during login request:', error);
            alert('Server connectivity error. Check console for details.');
        }

    } 
    // Phase 2: OTP Verification
    else {
        const otp = document.getElementById('otp').value;
        if (!otp) {
            alert("Please enter the 6-digit OTP.");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, otp }) 
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('OTP Verified! Welcome to the Dashboard.');
                // Successful verification: Redirect to dashboard
                window.location.href = 'dashboard.html'; 
            } else {
                alert(data.message || 'OTP verification failed. Invalid or expired OTP.');
            }
        } catch (error) {
            console.error('Error during OTP verification:', error);
            alert('Server connectivity error during OTP verification.');
        }
    }
}

/**
 * Handles the Register form submission
 */
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Registration Successful! Please login now.');
            
            // Switch back to login form
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('toggleForm').textContent = 'Register Now';
        } else {
            alert(data.message || 'Registration failed. User may already exist.');
        }
    } catch (error) {
        console.error('Error during registration request:', error);
        alert('Server connectivity error. Please ensure the backend is running.');
    }
}