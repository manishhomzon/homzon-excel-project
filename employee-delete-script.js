document.addEventListener('DOMContentLoaded', () => {
    // 1. HTML एलिमेंट्स को कैप्चर करें
    const empNameSelect = document.getElementById('deleteEmpName');
    const deleteForm = document.getElementById('deleteForm');
    
    // नया: मैसेज कंटेनर को कैप्चर करें (मान लें कि यह HTML में मौजूद है)
    const noRecordsMessageContainer = document.getElementById('noRecordsMessage');

    // 💥 सुरक्षा जाँच: यदि ड्रॉपडाउन नहीं मिला, तो स्क्रिप्ट को रोक दें 💥
    if (!empNameSelect) {
        console.error("CRITICAL ERROR: 'deleteEmpName' select box not found. Cannot initialize delete feature.");
        return;
    }

    // ==========================================================
    // 2. एम्प्लॉई ड्रॉपडाउन लोड करें
    // ==========================================================
    try {
        const employeesRaw = localStorage.getItem('employees');
        console.log("Raw Employee Data for Deletion:", employeesRaw);
        
        const employees = JSON.parse(employeesRaw) || [];
        
        console.log("Total Employees found to load for deletion:", employees.length);
        
        if (employees.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '-- No Employees Registered --';
            empNameSelect.appendChild(option);
            
            // अगर कोई एम्प्लॉई नहीं है:
            // a) फॉर्म को सबमिट करने से रोकें (हाइड करें)
            if(deleteForm) deleteForm.style.display = 'none'; 
            
            // b) नया मैसेज और Back Button दिखाएँ
            if(noRecordsMessageContainer) {
                noRecordsMessageContainer.innerHTML = `
                    <div class="alert alert-info" style="
                        background-color: #f8d7da; 
                        border: 1px solid #f5c6cb; 
                        color: #721c24; 
                        padding: 15px; 
                        margin-bottom: 20px;
                        border-radius: 5px;">
                        ⚠️ सभी कर्मचारी रिकॉर्ड सफलतापूर्वक डिलीट कर दिए गए हैं।
                    </div>
                    <a href="dashboard.html" class="action-btn back-btn" style="
                        display: inline-block; 
                        background-color: #007bff; 
                        color: white; 
                        text-decoration: none; 
                        padding: 10px 15px; 
                        border-radius: 4px;">
                        ← Dashboard पर वापस जाएँ
                    </a>
                `;
            }
            return;
        } else {
            // अगर कर्मचारी हैं, तो सुनिश्चित करें कि मैसेज कंटेनर खाली है
            if(noRecordsMessageContainer) noRecordsMessageContainer.innerHTML = '';
        }

        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.uniqueId;
            // नाम के साथ डिपार्टमेंट दिखाएं
            option.textContent = employee.name + ' (' + employee.department + ')'; 
            empNameSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error loading employees from Local Storage for deletion:", error);
    }


    // ==========================================================
    // 3. डिलीशन लॉजिक
    // ==========================================================
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const uniqueIdToDelete = empNameSelect.value;
            const employeeName = empNameSelect.options[empNameSelect.selectedIndex].textContent;

            if (!uniqueIdToDelete) {
                alert("Please select an employee to delete.");
                return;
            }

            const confirmation = confirm(
                `WARNING: Are you sure you want to PERMANENTLY delete the record for ${employeeName}?\n\nThis action cannot be undone.`
            );

            if (confirmation) {
                // 1. एम्प्लॉई को 'employees' array से फ़िल्टर करें
                const employeesRaw = localStorage.getItem('employees');
                const currentEmployees = JSON.parse(employeesRaw) || [];
                const updatedEmployees = currentEmployees.filter(emp => emp.uniqueId !== uniqueIdToDelete);
                localStorage.setItem('employees', JSON.stringify(updatedEmployees));
                
                // 2. अटेंडेंस हिस्ट्री से भी रिकॉर्ड्स हटाएँ 
                const historyRaw = localStorage.getItem('attendanceHistory');
                const attendanceHistory = JSON.parse(historyRaw) || [];
                const updatedAttendanceHistory = attendanceHistory.filter(record => record.uniqueId !== uniqueIdToDelete);
                localStorage.setItem('attendanceHistory', JSON.stringify(updatedAttendanceHistory));


                alert(`✅ Employee ${employeeName} and their attendance history have been successfully deleted.`);
                
                // पेज को रीलोड करें ताकि ड्रॉपडाउन अपडेट हो जाए
                window.location.reload(); 
            } else {
                alert("Deletion cancelled.");
            }
        });
    }
});