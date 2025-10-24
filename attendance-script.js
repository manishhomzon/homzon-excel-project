// ==========================================================
// 1. HELPER FUNCTIONS AND UTILITIES
// ==========================================================

function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

function updateDigitalClock() {
    const clockElement = document.getElementById('digitalClock');
    if (!clockElement) return;

    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    clockElement.textContent = timeString;
}

setInterval(updateDigitalClock, 1000); 

// ==========================================================
// 2. MAIN LOGIC (DOMContentLoaded)
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. सभी HTML एलिमेंट्स को कैप्चर करें
        const empNameSelect = document.getElementById('attEmpName');
        const deptInput = document.getElementById('attDepartment');
        const timeInInput = document.getElementById('timeIn');
        const attDateInput = document.getElementById('attDate');
        const statusSelect = document.getElementById('status');
        const overtimeHoursInput = document.getElementById('overtimeHours');
        const form = document.getElementById('attendanceForm');

        // 2. Local Storage से एम्प्लॉई डेटा लोड करें
        const rawData = localStorage.getItem('employees');
        const employees = JSON.parse(rawData) || [];
        
        console.log("Attendance Script is Running!");
        console.log("Total Employees found to load:", employees.length); 

        // 3. तारीख़ सेट करें
        if (attDateInput) {
            const todayDateString = getTodayDate();
            attDateInput.setAttribute('max', todayDateString);
            attDateInput.value = todayDateString;
        }


        // ** 4. एम्प्लॉई ड्रॉपडाउन को लोड करें **
        if (empNameSelect) {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "--- Select Employee ---";
            empNameSelect.appendChild(defaultOption);

            employees.forEach(employee => {
                console.log("Attempting to add employee:", employee.name); 
                
                const option = document.createElement('option');
                option.value = employee.uniqueId; 
                option.textContent = employee.name; 
                
                // Keys matched with employee-register.js data
                option.dataset.timeAllowed = employee.shift1TimeAllowed; 
                option.dataset.department = employee.department;
                option.dataset.maxShifts = employee.totalShifts || 1; 

                empNameSelect.appendChild(option);
            });
        } else {
             console.error("CRITICAL ERROR: 'attEmpName' select box not found. Cannot load names.");
        }


        // 5. इवेंट लिसनर सेटअप करें
        if (empNameSelect && deptInput && timeInInput && statusSelect && form) {
            
            // एम्प्लॉई चुनने पर डिपार्टमेंट फ़िल करें
            empNameSelect.addEventListener('change', function() {
                const selectedOption = empNameSelect.options[empNameSelect.selectedIndex];
                
                if (!selectedOption.value) {
                    deptInput.value = '';
                    timeInInput.value = '';
                    return;
                }
                
                deptInput.value = selectedOption.dataset.department || '';
                timeInInput.value = selectedOption.dataset.timeAllowed || '09:00'; 
                
                statusSelect.value = 'Present';
                if (overtimeHoursInput) {
                    overtimeHoursInput.value = 0;
                }
                
                attDateInput.value = getTodayDate();
            });

            // सबमिशन लॉजिक
            form.addEventListener('submit', function(event) {
                event.preventDefault(); 
                
                const selectedOption = empNameSelect.options[empNameSelect.selectedIndex];
                const selectedEmployeeId = selectedOption.value;
                const selectedDate = attDateInput.value;

                if (!selectedEmployeeId) { 
                    alert("कृपया एक एम्प्लॉई का चयन करें।"); 
                    return; 
                }
                
                const timeAllowed = selectedOption.dataset.timeAllowed;
                const timeIn = timeInInput.value;
                let finalStatus = statusSelect.value;
                const allowedTimeInMinutes = timeToMinutes(timeAllowed);
                const actualTimeInMinutes = timeToMinutes(timeIn);
                const overtimeHours = parseFloat(overtimeHoursInput.value) || 0; 
                
                let attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];
                const maxAllowedShifts = parseInt(selectedOption.dataset.maxShifts) || 1; 

                const currentDayAttendance = attendanceHistory.filter(record => 
                    record.uniqueId === selectedEmployeeId && 
                    record.date === selectedDate
                );

                if (finalStatus !== 'Absent') { 
                    if (currentDayAttendance.length >= maxAllowedShifts) {
                        alert(`❌ ERROR: Employee ${selectedOption.textContent} has already recorded ${currentDayAttendance.length} shifts on this date (${selectedDate}). Maximum allowed shifts is ${maxAllowedShifts}. Cannot submit more attendance.`);
                        return;
                    }
                }

                if (finalStatus === 'Absent' && currentDayAttendance.length > 0) {
                    alert(`❌ ERROR: Employee ${selectedOption.textContent} already has an attendance record for ${selectedDate} (Status: ${currentDayAttendance[0].status}). Cannot submit 'Absent' again.`);
                    return;
                } 
                
                // Late Check
                if (finalStatus === 'Present' && actualTimeInMinutes > allowedTimeInMinutes) {
                    alert("⚠️ Late Found! Status set to Late. Time-In (" + timeIn + ") exceeds Allowed Time (" + timeAllowed + ").");
                    finalStatus = 'Late';
                } else if (finalStatus === 'Present') {
                    alert(`✅ Attendance Submitted Successfully! On Time. (Shift ${currentDayAttendance.length + 1})`);
                } else if (finalStatus === 'Absent' || finalStatus === 'Halfday') {
                    alert(`📝 Attendance Submitted Successfully! Status: ${finalStatus}.`);
                }

                if (overtimeHours > 0) {
                     alert(`⭐ Overtime Recorded! ${overtimeHours} hours of OT will be counted for salary.`);
                }

                // अटेंडेंस डेटा सेव करें
                const attendanceRecord = {
                    uniqueId: selectedEmployeeId,
                    name: selectedOption.textContent,
                    department: deptInput.value,
                    timeIn: timeIn,
                    timeAllowed: timeAllowed,
                    date: selectedDate,
                    status: finalStatus,
                    overtimeHours: overtimeHours,
                    shiftNumber: currentDayAttendance.length + 1
                };
                
                console.log("Attendance Record to Save:", attendanceRecord);
                
                const existingIndex = attendanceHistory.findIndex(
                    record => record.uniqueId === selectedEmployeeId && record.date === selectedDate
                );

                if (existingIndex !== -1 && maxAllowedShifts === 1 && finalStatus !== 'Absent') {
                    attendanceHistory[existingIndex] = attendanceRecord;
                    alert("🔄 Previous Attendance Updated Successfully!");
                } else {
                    attendanceHistory.push(attendanceRecord);
                }

                localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));

                form.reset();
                attDateInput.value = getTodayDate(); 
            });
        }
    } catch (error) {
        console.error("FATAL SCRIPT INITIALIZATION ERROR:", error);
        alert("❌ स्क्रिप्ट शुरू करने में गंभीर त्रुटि आई है। कंसोल (F12) देखें।");
    }
});