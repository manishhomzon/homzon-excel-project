document.addEventListener('DOMContentLoaded', () => {
    const empNameSelect = document.getElementById('calcEmpName');
    const salaryForm = document.getElementById('salaryForm');
    const salaryOutput = document.getElementById('salaryOutput');
    const advanceDeductionInput = document.getElementById('advanceDeduction');
    const calcMonthSelect = document.getElementById('calcMonth');
    const calcYearSelect = document.getElementById('calcYear');

    // ==========================================================
    // 1. ड्रॉपडाउन लोड और इनिशियलाइज़ेशन
    // ==========================================================
    
    // महीने लोड करें
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        const option = document.createElement('option');
        // वैल्यू 01 से 12 तक
        option.value = String(index + 1).padStart(2, '0'); 
        option.textContent = month;
        calcMonthSelect.appendChild(option);
    });

    // वर्ष लोड करें (उदाहरण के लिए, वर्तमान वर्ष और पिछले 2 वर्ष)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        calcYearSelect.appendChild(option);
    }
    // डिफ़ॉल्ट रूप से वर्तमान महीना और वर्ष सेट करें
    calcMonthSelect.value = String(new Date().getMonth() + 1).padStart(2, '0');
    calcYearSelect.value = currentYear;


    // एम्प्लॉई ड्रॉपडाउन लोड करें
    const employeesRaw = localStorage.getItem('employees');
    const employees = JSON.parse(employeesRaw) || [];
    
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.uniqueId;
        option.textContent = employee.name + ' (' + employee.department + ')'; 
        option.dataset.details = JSON.stringify(employee); 
        empNameSelect.appendChild(option);
    });

    // ==========================================================
    // 2. कैलकुलेशन लॉजिक
    // ==========================================================
    
    if (salaryForm) {
        salaryForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const selectedUniqueId = empNameSelect.value;
            const month = calcMonthSelect.value;
            const year = calcYearSelect.value;
            const monthYear = `${year}-${month}`;
            const advanceDeduction = Number(advanceDeductionInput.value) || 0;

            if (!selectedUniqueId) {
                alert("Please select an employee.");
                return;
            }

            const selectedOption = empNameSelect.options[empNameSelect.selectedIndex];
            if (!selectedOption.dataset.details) {
                alert("Employee details are missing in registration data.");
                return;
            }
            const employeeDetails = JSON.parse(selectedOption.dataset.details);

            // अटेंडेंस हिस्ट्री फ़िल्टर करें
            const historyRaw = localStorage.getItem('attendanceHistory');
            const attendanceHistory = JSON.parse(historyRaw) || [];
            
            const monthRecords = attendanceHistory.filter(record => 
                record.uniqueId === selectedUniqueId && record.date.startsWith(monthYear)
            );

            // 1. अटेंडेंस समरी कैलकुलेट करें
            const summary = calculateAttendanceSummary(monthRecords, year, month);

            // 2. सैलरी की गणना करें
            const salaryData = calculateSalary(employeeDetails, summary, advanceDeduction);

            // 3. परिणाम दिखाएँ
            displaySalaryOutput(employeeDetails, summary, salaryData, monthYear, advanceDeduction);
        });
    }

    // ==========================================================
    // 3. कोर कैलकुलेशन फ़ंक्शन्स
    // ==========================================================
    
    function calculateAttendanceSummary(records, year, month) {
        const counts = { Present: 0, Late: 0, Absent: 0, Halfday: 0 };
        
        // उस महीने में कुल दिनों की संख्या (Date objects 1 से 31 तक काम करते हैं)
        const totalDaysInMonth = new Date(year, month, 0).getDate();

        // 1. Attended दिनों की गणना (Present, Late, Halfday)
        records.forEach(record => {
            const status = record.status;
            if (counts.hasOwnProperty(status)) {
                counts[status]++;
            } else if (status === 'Late') {
                 counts.Late++; // यदि गलती से 'Late' Present में चला गया हो
            }
        });
        
        // 2. Total Records (Attended Days)
        counts.AttendedDays = records.length; 
        
        // 3. Total Absent Days (Total Days in Month - Total Records)
        counts.TotalAbsentDays = totalDaysInMonth - counts.AttendedDays; 
        
        counts.TotalAbsentDays = Math.max(0, counts.TotalAbsentDays); 
        counts.TotalWorkingDays = totalDaysInMonth; // गणना के लिए महीने के सभी दिनों का उपयोग करें
        
        return counts;
    }

    function calculateSalary(details, summary, advanceDeduction) {
        const basicSalary = Number(details.basicSalary || 0);
        const specialAllowance = Number(details.specialAllowance || 0);
        const conveyance = Number(details.conveyance || 0);
        const paidLeaves = Number(details.paidLeaves || 0); // Registration page से Paid Leaves
        
        const totalDays = summary.TotalWorkingDays; 
        const fullGrossSalary = basicSalary + specialAllowance + conveyance;
        
        // Per Day Salary
        const perDaySalary = fullGrossSalary / totalDays;
        
        // =========================================================
        // 1. अटेंडेंस के आधार पर कटौती की गणना
        // =========================================================
        
        // Total Absent Days (Backend Process: Absent + Late Equivalent + Halfday Equivalent)
        const lateEquivalent = summary.Late / 3; // 3 Late = 1 day salary cut
        const halfdayEquivalent = summary.Halfday / 2; // 2 Halfday = 1 day salary cut
        
        // Total Absent days (Actual Absent from records + equivalent cuts)
        const totalAbsentEquivalent = summary.TotalAbsentDays + lateEquivalent + halfdayEquivalent;
        
        
        // 💥 PAID LEAVE PRO-RATA FIX: Paid Leave का उपयोग केवल प्रो-राटा बेसिस पर करें 💥
        // 1. पहले यह निकालें कि कर्मचारी को कितने Paid Leave मिल सकते हैं (जितने दिन काम किया है उसके अनुपात में)
        const eligiblePaidLeaves = paidLeaves * (summary.AttendedDays / totalDays);
        
        // 2. Actual Absent days (Paid Leaves के बाद)
        const actualAbsentDays = Math.max(0, totalAbsentEquivalent - eligiblePaidLeaves); 
        
        // Total Payable Days
        const totalPayableDays = totalDays - actualAbsentDays; 
        
        // यदि payable days नेगेटिव हो तो 0 सेट करें
        const finalPayableDays = Math.max(0, totalPayableDays);


        // =========================================================
        // 2. ग्रॉस सैलरी की गणना
        // =========================================================
        const actualGrossEarning = Math.round(perDaySalary * finalPayableDays);


        // =========================================================
        // 3. वैधानिक कटौती (Statutory Deductions)
        // =========================================================
        let totalDeductions = advanceDeduction;
        let epfDeduction = 0;
        let esicDeduction = 0;
        
        // EPF (12% Basic + SA पर) - कटौती केवल Payable Days के अनुपात में
        if (details.epf === 'Yes') {
            const epfBase = basicSalary + specialAllowance;
            // EPF कटौती को Payable Days के अनुपात में एडजस्ट करें
            epfDeduction = Math.round((epfBase * 0.12) * (finalPayableDays / totalDays));
            totalDeductions += epfDeduction;
        }

        // ESIC (0.75% Actual Gross पर) - कटौती केवल Payable Days पर आधारित होनी चाहिए
        if (details.esic === 'Yes') {
            esicDeduction = Math.round(actualGrossEarning * 0.0075);
            totalDeductions += esicDeduction;
        }

        // 4. नेट सैलरी (Net Pay)
        const netSalary = actualGrossEarning - totalDeductions;

        return {
            perDaySalary: Math.round(perDaySalary),
            actualGrossEarning,
            epfDeduction,
            esicDeduction,
            totalDeductions,
            netSalary,
            totalPayableDays: finalPayableDays,
            actualAbsentDays, // Paid Leaves के बाद का Absent
            totalAbsentEquivalent,
            eligiblePaidLeaves: eligiblePaidLeaves // नई जानकारी जोड़ी
        };
    }

    // ==========================================================
    // 4. आउटपुट दिखाना (Updated to show new Paid Leave details)
    // ==========================================================
    
    function displaySalaryOutput(details, summary, salaryData, monthYear, advanceDeduction) {
        
        // सभी आउटपुट divs दिखाएँ
        document.getElementById('employeeDetails').style.display = 'block';
        document.getElementById('attendanceSummary').style.display = 'block';
        document.getElementById('salaryOutput').style.display = 'block';

        // Employee Details
        document.getElementById('outName').textContent = details.name;
        document.getElementById('outCode').textContent = details.uniqueId || 'N/A'; // Employee Code
        document.getElementById('outDept').textContent = details.department;
        document.getElementById('outDesignation').textContent = details.designation;
        document.getElementById('outBasic').textContent = `₹ ${details.basicSalary}`;
        document.getElementById('outSpecial').textContent = `₹ ${details.specialAllowance}`;
        document.getElementById('outConveyance').textContent = `₹ ${details.conveyance}`;
        
        // 💥 NEW: अब eligiblePaidLeaves को भी दिखाएँ
        document.getElementById('outPaidLeaves').textContent = 
            `${details.paidLeaves || 0} (Eligible: ${salaryData.eligiblePaidLeaves.toFixed(2)})`;

        // Attendance Summary
        document.getElementById('sumTotalDays').textContent = summary.TotalWorkingDays;
        document.getElementById('sumPresent').textContent = summary.Present;
        document.getElementById('sumLate').textContent = summary.Late;
        document.getElementById('sumHalfday').textContent = summary.Halfday;
        document.getElementById('sumTotalAbsent').textContent = salaryData.totalAbsentEquivalent.toFixed(2);
        document.getElementById('sumActualAbsent').textContent = salaryData.actualAbsentDays.toFixed(2);


        // Final Calculation
        document.getElementById('outPayableDays').textContent = salaryData.totalPayableDays.toFixed(2);
        document.getElementById('outPerDay').textContent = `₹ ${salaryData.perDaySalary}`;
        document.getElementById('outGrossEarning').textContent = `₹ ${salaryData.actualGrossEarning}`;
        
        document.getElementById('outEPF').textContent = `₹ ${salaryData.epfDeduction} (${details.epf === 'Yes' ? '12%' : 'N/A'})`;
        document.getElementById('outESIC').textContent = `₹ ${salaryData.esicDeduction} (${details.esic === 'Yes' ? '0.75%' : 'N/A'})`;
        document.getElementById('outAdvance').textContent = `₹ ${advanceDeduction}`;
        
        document.getElementById('outNetPay').textContent = `₹ ${salaryData.netSalary}`;
    }
});