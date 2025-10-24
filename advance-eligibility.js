// ==========================================================
// HELPER FUNCTION: Calculates Advance Eligibility
// ==========================================================
function calculateAdvanceEligibility(employeeId) {
    // 1. लोकल स्टोरेज से डेटा लोड करें
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];

    // 2. वर्तमान कर्मचारी का डेटा खोजें
    const employee = employees.find(emp => emp.uniqueId === employeeId);
    
    // यदि कर्मचारी नहीं मिला या ज़रूरी डेटा गुम है, तो एरर
    if (!employee || !employee.basicSalary) {
        console.error(`ERROR: Employee data (Basic Salary) not found for ID: ${employeeId}`);
        alert(`Error: Complete Employee Salary details not available. Please check registration.`);
        
        document.getElementById('eligibilityHeader').textContent = "HOMZON GROUP ADVANCE ELIGIBILITY CALCULATOR";
        document.getElementById('subHeader').textContent = "Please select an employee to view the estimated advance for the month.";
        document.getElementById('currentSalaryDisplay').textContent = "Total Estimated Earned Salary (Up to Today): ₹ 0.00";
        document.getElementById('advanceAmountDisplay').textContent = "₹ 0.00";
        return;
    }
    
    // 3. समय की जानकारी
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12 (for comparison with localStorage month format)
    const currentYear = today.getFullYear();
    const currentDay = today.getDate(); // 1-30

    // Daily Rate के लिए महीने के ACTUAL दिनों का उपयोग करें (Salary Dashboard के समान) 
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate(); 
    
    
    // 4. अटेंडेंस समरी कैलकुलेट करें (Salary-Calculation-Script के लॉजिक का उपयोग)
    let summary = { Present: 0, Late: 0, Halfday: 0 };
    
    const monthRecords = attendanceHistory.filter(record => {
        if (!record.date) return false;
        
        const recordDate = new Date(record.date);
        const recordMonth = recordDate.getMonth() + 1;
        const recordYear = recordDate.getFullYear();

        // केवल वर्तमान महीने तक के रिकॉर्ड ही लें (आज तक)
        if (
            record.uniqueId === employeeId &&
            recordYear === currentYear &&
            recordMonth === currentMonth &&
            recordDate.getDate() <= currentDay // केवल आज तक के दिन शामिल करें
        ) {
            const status = record.status;
            if (summary.hasOwnProperty(status)) {
                summary[status]++;
            } else if (status === 'Absent') {
                 // Absent को यहाँ काउंट नहीं करेंगे, बाद में Attended Days से निकालेंगे
            }
            return true;
        }
        return false;
    });

    summary.AttendedDays = monthRecords.length; // Records की संख्या ही Attended Days है
    summary.TotalWorkingDays = totalDaysInMonth;
    
    // -------------------------------------------------------------
    // 5. CORE SALARY CALCULATION (Exact logic from salary-calculation-script.js)
    // -------------------------------------------------------------
    const basicSalary = Number(employee.basicSalary || 0);
    const specialAllowance = Number(employee.specialAllowance || 0);
    const conveyance = Number(employee.conveyance || 0);
    const paidLeaves = Number(employee.paidLeaves || 0);
        
    const totalDays = summary.TotalWorkingDays; 
    const fullGrossSalary = basicSalary + specialAllowance + conveyance;
        
    // Per Day Salary (Gross per day)
    const perDaySalary = fullGrossSalary / totalDays;
    
    // 5.1. Total Absent Days (Total Days in Month - Attended Records)
    const totalAbsentFromRecords = totalDays - summary.AttendedDays;
    
    // 5.2. अटेंडेंस के आधार पर कटौती की गणना
    const lateEquivalent = summary.Late / 3; // 3 Late = 1 day salary cut
    const halfdayEquivalent = summary.Halfday / 2; // 2 Halfday = 1 day salary cut
        
    // Total Absent days (Actual Absent from records + equivalent cuts)
    const totalAbsentEquivalent = totalAbsentFromRecords + lateEquivalent + halfdayEquivalent;
        
        
    // 5.3. Paid Leave समायोजन
    const eligiblePaidLeaves = paidLeaves * (summary.AttendedDays / totalDays);
        
    // 5.4. Actual Absent days (Paid Leaves के बाद)
    const actualAbsentDays = Math.max(0, totalAbsentEquivalent - eligiblePaidLeaves); 
        
    // 5.5. Total Payable Days
    const totalPayableDays = totalDays - actualAbsentDays; 
    const finalPayableDays = Math.max(0, totalPayableDays);


    // 5.6. ग्रॉस सैलरी की गणना (जिसकी हमें 50% एलिजिबिलिटी चाहिए)
    // यह ठीक वही "actualGrossEarning" है जो Salary Dashboard में उपयोग होता है
    const actualGrossEarning = Math.round(perDaySalary * finalPayableDays);
    
    
    // -------------------------------------------------------------
    // 6. FINAL ELIGIBILITY CALCULATION (50% of the calculated Earning)
    // -------------------------------------------------------------

    // Net Payable Salary का 50% Eligibility (चूंकि Earned Net Salary का कोई साफ डेटा नहीं है,
    // हम मान लेंगे कि Gross Earning के 50% का एडवांस दिया जा सकता है)
    const advanceEligibility = actualGrossEarning * 0.50; 
    
    // --- Console Log for Debugging ---
    console.log(`--- Advance Eligibility Check: ${employee.name} ---`);
    console.log(`Full Gross Monthly Salary (B+SA+C): ₹${fullGrossSalary.toFixed(2)}`);
    console.log(`Total Days in Month: ${totalDaysInMonth}`);
    console.log(`Payable Days (Adjusted): ${finalPayableDays.toFixed(2)}`);
    console.log(`Actual Gross Earning (Salary Dashboard equivalent): ₹${actualGrossEarning.toFixed(2)}`);
    console.log(`Advance Eligibility (50% of Earning): ₹${advanceEligibility.toFixed(2)}`);
    // ------------------------------------

    // 7. UI अपडेट करें
    document.getElementById('eligibilityHeader').innerHTML = `
        Dear Employee: <span style="color:#dc3545;">${employee.name}</span>, Your Advance Eligibility (50%) is:
    `;
    document.getElementById('subHeader').textContent = 
        `You have ${summary.AttendedDays} attended day(s) up to today (${currentDay}). Earning is based on ${finalPayableDays.toFixed(2)} payable days.`;
        
    document.getElementById('currentSalaryDisplay').textContent = 
        `Total Estimated Gross Earning (Up to Today): ₹ ${actualGrossEarning.toFixed(2)}`;
        
    document.getElementById('advanceAmountDisplay').textContent = `₹ ${advanceEligibility.toFixed(2)}`;
}


// ==========================================================
// MAIN LOGIC (DOMContentLoaded)
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const empNameSelect = document.getElementById('advEmpName');
    
    // लोकल स्टोरेज से एम्प्लॉई डेटा लोड करें
    const employees = JSON.parse(localStorage.getItem('employees')) || [];
    
    // ड्रॉपडाउन लोड करें
    if (empNameSelect) {
         const defaultOption = document.createElement('option');
         defaultOption.value = "";
         defaultOption.textContent = "--- Select Employee ---";
         empNameSelect.appendChild(defaultOption);

        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.uniqueId;
            option.textContent = employee.name; 
            empNameSelect.appendChild(option);
        });
    }

    // इवेंट लिसनर: जब कोई एम्प्लॉई चुना जाता है
    empNameSelect.addEventListener('change', function() {
        const selectedOption = empNameSelect.options[empNameSelect.selectedIndex];
        
        if (!selectedOption.value) {
             document.getElementById('eligibilityHeader').textContent = "HOMZON GROUP ADVANCE ELIGIBILITY CALCULATOR";
             document.getElementById('subHeader').textContent = "Please select an employee to view the estimated advance for the month.";
             document.getElementById('currentSalaryDisplay').textContent = "Total Estimated Earned Salary (Up to Today): ₹ 0.00";
             document.getElementById('advanceAmountDisplay').textContent = "₹ 0.00";
             return;
        }

        const employeeId = selectedOption.value;
        calculateAdvanceEligibility(employeeId);
    });
    
    // पेज लोड होने पर शुरुआती हेडर सेट करें
    document.getElementById('eligibilityHeader').textContent = "HOMZON GROUP ADVANCE ELIGIBILITY CALCULATOR";
    document.getElementById('subHeader').textContent = "Please select an employee to view the estimated advance for the month.";
});