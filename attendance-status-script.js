document.addEventListener('DOMContentLoaded', () => {
    const empNameSelect = document.getElementById('statusEmpName');
    const statusForm = document.getElementById('statusForm');
    const tableBody = document.querySelector('#attendanceTable tbody');
    const noDataMessage = document.getElementById('noDataMessage');
    const summaryOutput = document.getElementById('summaryOutput');

    // 1. एम्प्लॉई ड्रॉपडाउन को लोड करें (जैसा आपने पहले किया था)
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        // हम uniqueId का उपयोग करते हैं
        option.value = employee.uniqueId; 
        option.textContent = employee.name; 
        empNameSelect.appendChild(option);
    });

    // 2. सबमिशन लॉजिक
    statusForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const selectedUniqueId = empNameSelect.value;

        if (!selectedUniqueId) {
            alert("Please select an employee.");
            return;
        }

        // अटेंडेंस हिस्ट्री लोड करें
        const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];

        // चयनित एम्प्लॉई के लिए रिकॉर्ड्स फ़िल्टर करें
        const employeeRecords = attendanceHistory.filter(record => 
            // uniqueId का उपयोग करें। यदि uniqueId रिकॉर्ड में नहीं है, तो नाम से फ़िल्टर करें
            (record.uniqueId && record.uniqueId === selectedUniqueId) || 
            (record.name.toLowerCase() === empNameSelect.options[empNameSelect.selectedIndex].textContent.toLowerCase())
        );

        displayRecords(employeeRecords);
    });

    // 3. रिकॉर्ड्स को टेबल में दिखाने का फ़ंक्शन
    function displayRecords(records) {
        tableBody.innerHTML = ''; // पिछली एंट्री साफ़ करें
        
        if (records.length === 0) {
            noDataMessage.textContent = `No attendance records found for this employee.`;
            summaryOutput.innerHTML = '';
            return;
        }

        noDataMessage.textContent = ''; // मैसेज साफ़ करें

        // समरी काउंटिंग
        const summary = { Present: 0, Absent: 0, Late: 0, Halfday: 0 };

        records.forEach(record => {
            const row = tableBody.insertRow();
            
            // स्टेटस के आधार पर CSS क्लास जोड़ें
            row.classList.add(record.status.toLowerCase()); 

            row.insertCell(0).textContent = record.date;
            row.insertCell(1).textContent = record.timeIn;
            row.insertCell(2).textContent = record.timeAllowed;
            row.insertCell(3).textContent = record.status;
            row.insertCell(4).textContent = record.department;

            // समरी अपडेट करें
            summary[record.status] = (summary[record.status] || 0) + 1;
        });

        // समरी आउटपुट दिखाएँ
        summaryOutput.innerHTML = `
            <strong>Total Records:</strong> ${records.length} &nbsp;|&nbsp;
            <strong>Present:</strong> <span style="color: green;">${summary.Present}</span> &nbsp;|&nbsp;
            <strong>Absent:</strong> <span style="color: red;">${summary.Absent}</span> &nbsp;|&nbsp;
            <strong>Late:</strong> <span style="color: orange;">${summary.Late}</span> &nbsp;|&nbsp;
            <strong>Halfday:</strong> <span style="color: purple;">${summary.Halfday}</span>
        `;
    }
});