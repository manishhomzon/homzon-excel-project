// employee-register.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('employeeRegistrationForm');

    // Local Storage Initialization: अगर 'employees' Key नहीं है, तो एक खाली Array शुरू करें
    if (localStorage.getItem('employees') === null) {
        localStorage.setItem('employees', JSON.stringify([]));
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // फॉर्म को सबमिट होने से रोकता है

        try {
            // 1. फ़ॉर्म डेटा कलेक्ट और साफ करें
            const empName = document.getElementById('empName').value.trim();
            const department = document.getElementById('department').value.trim(); // Trim added for safety
            const designation = document.getElementById('designation').value.trim();
            
            // शिफ्ट डेटा कैप्चर
            const totalShifts = parseInt(document.getElementById('totalShifts')?.value) || 1;
            const shift1TimeAllowed = document.getElementById('shift1TimeAllowed')?.value || ''; // Mandatory check below
            const shift2TimeAllowed = document.getElementById('shift2TimeAllowed')?.value || '';
            const shift3TimeAllowed = document.getElementById('shift3TimeAllowed')?.value || '';
            
            // सैलरी कॉम्पोनेंट्स को Parse करें (parseFloat के साथ सुरक्षित)
            const basicSalary = parseFloat(document.getElementById('basicSalary')?.value) || 0;
            const specialAllowance = parseFloat(document.getElementById('specialAllowance')?.value) || 0;
            const conveyance = parseFloat(document.getElementById('conveyance')?.value) || 0;
            const paidLeaves = parseFloat(document.getElementById('paidLeaves')?.value) || 0;
            
            // स्टैटुटरी (Optional Chaining के साथ सुरक्षित)
            const epfApplicable = document.querySelector('input[name="epf"]:checked')?.value || 'No';
            const esicApplicable = document.querySelector('input[name="esic"]:checked')?.value || 'No';
            
            // 2. आवश्यक फ़ील्ड्स और वैलिडेशन की जाँच
            if (!empName || !department || !designation || !shift1TimeAllowed) {
                alert("❌ कृपया सभी अनिवार्य फ़ील्ड्स (नाम, डिपार्टमेंट, डेज़िग्नेशन, और Shift 1 Time-Allowed) भरें।");
                return;
            }
            
            // 💥 VALIDATION IMPROVEMENT: सुनिश्चित करें कि सैलरी फ़ील्ड्स NaN न हों
            if (isNaN(basicSalary) || isNaN(specialAllowance) || isNaN(conveyance) || isNaN(paidLeaves)) {
                 alert("❌ सैलरी के कॉम्पोनेंट्स केवल अंक (Numbers) होने चाहिए।");
                 return;
            }

            // शिफ्ट टाइमिंग की जाँच (आपका लॉजिक सही है)
            if (totalShifts >= 2 && !shift2TimeAllowed) {
                alert("❌ आपने 2 या उससे अधिक शिफ्ट चुनी हैं। Shift 2 Time Allowed अनिवार्य है।");
                return;
            }
            if (totalShifts === 3 && !shift3TimeAllowed) {
                alert("❌ आपने 3 शिफ्ट चुनी हैं। Shift 3 Time Allowed अनिवार्य है।");
                return;
            }


            // 3. 💰 सैलरी और एडवांस एलिजिबिलिटी गणना करें
            const grossMonthlySalary = basicSalary + specialAllowance + conveyance;
            const dailySalaryRate = grossMonthlySalary > 0 ? (grossMonthlySalary / 30).toFixed(2) : '0.00'; 
            
            // 4. यूनीक ID बनाएँ और एम्प्लॉई ऑब्जेक्ट तैयार करें
            const uniqueId = `EMP-${Date.now()}-${empName.replace(/\s/g, '').toLowerCase()}`; 

            const newEmployee = {
                uniqueId: uniqueId, 
                name: empName,
                department: department,
                designation: designation,
                
                // शिफ्ट डेटा सेव करें
                totalShifts: totalShifts,
                shift1TimeAllowed: shift1TimeAllowed,
                shift2TimeAllowed: totalShifts >= 2 ? shift2TimeAllowed : '',
                shift3TimeAllowed: totalShifts === 3 ? shift3TimeAllowed : '',
                
                // 💰 सैलरी डेटा (toFixed(2) के साथ स्ट्रिंग फॉर्मेट में सेव करें)
                basicSalary: basicSalary.toFixed(2),
                specialAllowance: specialAllowance.toFixed(2),
                conveyance: conveyance.toFixed(2),
                paidLeaves: paidLeaves, // Leaves can be fractional
                
                grossMonthlySalary: grossMonthlySalary.toFixed(2), 
                dailySalaryRate: dailySalaryRate,                  
                
                // 📋 स्टैटुटरी
                epfApplicable: epfApplicable,
                esicApplicable: esicApplicable,
                
                // 🔑 NEW: एक स्टेटस फ़ील्ड जोड़ें (डैशबोर्ड फ़िल्टरिंग के लिए उपयोगी)
                registrationStatus: 'Registered',
                salaryCalculated: grossMonthlySalary > 0 ? true : false // अगर सैलरी > 0 है तो true
            };

            // 5. लोकल स्टोरेज से मौजूदा एम्प्लॉई डेटा लोड करें
            const existingData = localStorage.getItem('employees');
            let employees = JSON.parse(existingData) || [];
            
            // 6. डुप्लिकेट नाम/डिपार्टमेंट की जाँच
            const nameCheckId = `${empName}-${department}`.toLowerCase();
            const isDuplicate = employees.some(emp => `${emp.name}-${emp.department}`.toLowerCase() === nameCheckId);

            if (isDuplicate) {
                alert("❌ Employee already Registered with this Name and Department!");
            } else {
                // 7. नया एम्प्लॉई जोड़ें और डेटा को अपडेट करें
                employees.push(newEmployee);
                
                // Local Storage में सेव करें
                localStorage.setItem('employees', JSON.stringify(employees));
                
                alert(`✅ Employee Registered Successfully! Shifts: ${totalShifts}, Unique ID: ${newEmployee.uniqueId}`);
                
                // फॉर्म को रीसेट करें
                form.reset();
            }
        } catch (error) {
            alert("❌ FATAL ERROR: Registration failed. Check Console (F12) for details.");
            console.error("FATAL ERROR IN REGISTRATION:", error);
        }
    });
});