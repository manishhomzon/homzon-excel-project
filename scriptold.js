// =======================================================
// CONFIGURATION: आपका Apps Script Web App URL
// ** इसे अपनी असली Apps Script URL से बदलें **
// =======================================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbwPBeFr-__XXqd8rLzH7jp73hmOzd-DCZG8qgDaB_qK/dev"; 

let userRole = null;
let userEmail = null;

// =======================================================
// HELPER FUNCTIONS
// =======================================================

function displayMessage(msg, color = 'red') {
    const msgElement = document.getElementById('message');
    if (msgElement) {
        msgElement.textContent = msg;
        msgElement.style.color = color;
    }
}

// -------------------------------------------------------
// Finance Access Check (RBAC के लिए)
// -------------------------------------------------------
function handleFinanceAccess(buttonName) {
    const userRole = localStorage.getItem('userRole');

    // Rule 1: Finance या Admin को फुल एक्सेस
    if (userRole === 'Admin' || userRole === 'Finance') {
        alert(`Authorized access to: ${buttonName}`);
        // window.location.href = 'relevant-dashboard.html'; // यहाँ असली लिंक दें
    } 
    // Rule 2: Employee को सिर्फ Print Salary Slip की अनुमति
    else if (userRole === 'Employee' && buttonName === 'Print Salary Slip') {
        alert(`Authorized for Self: ${buttonName}`);
        // window.location.href = 'salary-slip-print.html'; // यहाँ असली लिंक दें
    }
    // Rule 3: बाकी सब पर Unauthorized Popup
    else {
        alert("You are not Authorised for this: " + buttonName);
    }
}

// =======================================================
// 1. LOGIN (GAS को कॉल करता है)
// यह login.html के लिए है
// =======================================================

function handleLogin(event) {
    if (event) event.preventDefault();
    
    // login.html में ID 'email' है
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const password = document.getElementById('password') ? document.getElementById('password').value.trim() : '';
    
    if (!email || !password) {
        displayMessage('Please enter both email and password.', 'red');
        return;
    }
    
    displayMessage('Logging in...', 'blue');

    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', email);
    formData.append('password', password);

    fetch(GAS_URL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                // Login सफल! Role, Email और Name को Local Storage में सेव करें
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userEmail', data.email);
                localStorage.setItem('userName', data.name || data.email); // Name नहीं मिला तो Email यूज़ करें
                
                // Login सफल होने पर Role का नाम दिखाएँ
                displayMessage(`Login successful! Your Role is ${data.role}. Redirecting...`, 'green');
                
                window.location.href = 'dashboard.html'; 
                
            } else {
                displayMessage('Login Failed: ' + data.message, 'red');
            }
        })
        .catch(error => {
            console.error('Login API Error:', error);
            displayMessage('Login failed. Check your Apps Script URL and Deployment.', 'red'); 
        });
}


// =======================================================
// 2. LOGOUT (सभी पेज के लिए उपलब्ध)
// =======================================================

function handleLogout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = 'login.html'; 
}

// =======================================================
// 3. ATTENDANCE SUBMISSION (dashboard.html के लिए)
// =======================================================

function handleAttendanceSubmission(event) {
    event.preventDefault();

    const userRole = localStorage.getItem('userRole');
    const loggedInEmail = localStorage.getItem('userEmail');
    const form = document.getElementById('attendanceForm');
    const submitBtn = document.getElementById('markAttendanceBtn');

    let emailToMark = loggedInEmail; 
    
    // अगर Supervisor/Admin/HR फॉर्म इस्तेमाल कर रहा है
    if (userRole === 'Supervisor' || userRole === 'Admin' || userRole === 'HR') {
        const supEmailInput = document.getElementById('emailToMark');
        if (supEmailInput) {
            emailToMark = supEmailInput.value.trim();
        }
    }
    
    if (!emailToMark) {
        alert('Please enter an employee email.');
        return;
    }

    const formData = new FormData(form);
    formData.append('action', 'mark_attendance'); 
    formData.append('loggedInEmail', loggedInEmail); 
    formData.append('userRole', userRole); 
    formData.append('emailToMark', emailToMark); 

    submitBtn.textContent = 'Marking...';
    submitBtn.disabled = true;

    fetch(GAS_URL, { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            console.error('Attendance Submission Error:', error);
            alert('Attendance submission failed.');
        })
        .finally(() => {
            submitBtn.textContent = (userRole === 'Supervisor' || userRole === 'Admin' || userRole === 'HR') ? 'Mark Attendance for Employee' : 'Mark My Attendance Today';
            submitBtn.disabled = false;
        });
}


// =======================================================
// 4. DASHBOARD UI MANAGEMENT (RBAC)
// =======================================================

function manageDashboardUI(role) {
    // 1. सभी बटनों/सेक्शन को छिपाएँ (CSS से डिस्प्ले:none)
    document.querySelectorAll('.action-btn, .role-section').forEach(el => {
        el.style.display = 'none';
    });

    // 2. यूजर के रोल के लिए बटनों और सेक्शन को दिखाएँ
    // यह role-Admin और role-All वाले सभी एलिमेंट्स को दिखाएगा
    const allowedElements = document.querySelectorAll('.role-' + role + ', .role-All');
    allowedElements.forEach(el => {
        el.style.display = 'block';
    });
    
    // 3. Welcome Message अपडेट करें (Role Display)
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.textContent = `वेलकम, ${localStorage.getItem('userName')}! (${role} Role)`;
    }

    // 4. Attendance Form Logic (Supervisor/Admin को Email Field दिखाना)
    const supEmailGroup = document.getElementById('supervisor-email-group');
    if (role === 'Supervisor' || role === 'Admin' || role === 'HR') {
        if (supEmailGroup) supEmailGroup.style.display = 'block';
        document.getElementById('emailToMark').value = ''; 
        document.getElementById('markAttendanceBtn').textContent = 'Mark Attendance for Employee';
    } else {
        // Employee के लिए सिर्फ अपना Email मार्क करने का बटन
        if (supEmailGroup) supEmailGroup.style.display = 'none';
        document.getElementById('markAttendanceBtn').textContent = 'Mark My Attendance Today';
    }
}


// =======================================================
// 5. INITIAL CHECK & EVENT LISTENERS
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    const attendanceForm = document.getElementById('attendanceForm');
    const userRole = localStorage.getItem('userRole');

    // A. Login Page Logic
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // B. Dashboard Page Logic
    if (window.location.pathname.includes('dashboard.html')) {
        if (!userRole) {
            // अगर लॉगिन नहीं है, तो लॉगिन पेज पर भेजें
            window.location.href = 'login.html'; 
        } else {
            // लॉगिन सफल होने पर UI को मैनेज करें
            manageDashboardUI(userRole); 
            
            // Attendance Form Listener
            if (attendanceForm) {
                attendanceForm.addEventListener('submit', handleAttendanceSubmission);
            }
        }
    }
});