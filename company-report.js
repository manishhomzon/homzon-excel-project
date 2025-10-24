// ==========================================================
// 1. HELPER FUNCTIONS AND UTILITIES
// ==========================================================

// आज की तारीख़ को YYYY-MM-DD फॉर्मेट में फ़ॉर्मेट करता है
function getTodayDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // 1-12
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// मासिक सकल वेतन (Monthly Gross Salary) की गणना करता है
function calculateGrossMonthlySalary(employee) {
    const basic = parseFloat(employee.basicSalary) || 0;
    const special = parseFloat(employee.specialAllowance) || 0;
    const conv = parseFloat(employee.conveyance) || 0;
    return basic + special + conv;
}

// ==========================================================
// 2. CORE REPORT GENERATION LOGIC
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // HTML एलिमेंट्स
    const reportTableBody = document.getElementById('reportTableBody');
    const generateReportBtn = document.getElementById('generateReportBtn');
    const reportTotalsDiv = document.getElementById('reportTotals');

    // महीने और साल के लिए डिफ़ॉल्ट मान सेट करें
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    // UI में महीने और साल को अपडेट करें (यदि आवश्यक हो)
    const reportYearInput = document.getElementById('reportYear');
    if (reportYearInput) {
        reportYearInput.value = currentYear;
    }
    
    // वर्तमान माह में कुल दिनों की संख्या (सैलरी गणना के लिए)
    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();


    // Core Report Generation Function
    function generateCompanyReport() {
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory')) || [];
        const advanceHistory = JSON.parse(localStorage.getItem('advanceHistory')) || []; // 🌟 NEW: एडवांस हिस्ट्री लोड करें
        
        // वर्तमान माह/साल के लिए फ़िल्टर सेट करें
        const filterMonth = currentMonth; 
        const filterYear = currentYear;
        
        let totalPayableSalaryCompany = 0; // कंपनी का कुल पेयबल सैलरी
        let totalAdvancePaidCompany = 0; // कंपनी का कुल एडवांस पेड
        let tableRowsHTML = '';

        if (employees.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="5" class="info-note" style="color: #dc3545;">कोई कर्मचारी पंजीकृत नहीं है।</td></tr>';
            reportTotalsDiv.innerHTML = 'Total Payable Salary: <span class="data-total">₹ 0.00</span> | Total Advance Paid: <span class="data-total">₹ 0.00</span>';
            return;
        }

        employees.forEach(employee => {
            const monthlyGrossSalary = calculateGrossMonthlySalary(employee);
            const dailyRate = monthlyGrossSalary / totalDaysInMonth;
            
            // 1. अटेंडेंस और वर्किंग डेज़ की गणना करें (आज तक)
            let workingDays = 0;
            const employeeMonthAttendance = attendanceHistory.filter(record => {
                const recordDate = new Date(record.date);
                return (
                    record.uniqueId === employee.uniqueId &&
                    recordDate.getFullYear() === filterYear &&
                    (recordDate.getMonth() + 1) === filterMonth
                );
            });
            
            employeeMonthAttendance.forEach(record => {
                if (record.status === 'Present' || record.status === 'Late') {
                    workingDays++;
                } else if (record.status === 'Halfday') {
                    workingDays += 0.5;
                }
            });

            // 2. इस महीने के लिए कुल एडवांस पेड की गणना करें
            let totalAdvancePaid = 0;
            const employeeMonthAdvances = advanceHistory.filter(record => {
                const recordDate = new Date(record.date);
                 return (
                    record.uniqueId === employee.uniqueId &&
                    recordDate.getFullYear() === filterYear &&
                    (recordDate.getMonth() + 1) === filterMonth
                );
            });

            employeeMonthAdvances.forEach(record => {
                totalAdvancePaid += parseFloat(record.amount) || 0;
            });
            
            // 3. सैलरी और पेयबल सैलरी की गणना करें (Gross Earned - Advance Paid)
            
            // आज तक की अर्जित (Earned) Gross Salary
            const earnedGrossSalary = workingDays * dailyRate; 
            
            // Payable Salary का अनुमान: Earned Gross Salary में से Advance Paid को घटाएं
            // 🚨 Note: यह एक सरलीकृत गणना है जिसमें EPF/ESIC/PT कटौती शामिल नहीं है।
            let payableSalaryEstimate = earnedGrossSalary - totalAdvancePaid;
            
            // सुनिश्चित करें कि पेयबल सैलरी नेगेटिव न हो
            payableSalaryEstimate = Math.max(0, payableSalaryEstimate);

            totalAdvancePaidCompany += totalAdvancePaid;
            totalPayableSalaryCompany += payableSalaryEstimate;


            // 4. तालिका में डेटा जोड़ें (नए कॉलम्स के अनुसार)
            tableRowsHTML += `
                <tr>
                    <td>${employee.name}</td>
                    <td>${employee.department}</td>
                    <td>₹ ${monthlyGrossSalary.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td class="data-advance">₹ ${totalAdvancePaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td class="data-total">₹ ${payableSalaryEstimate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
            `;
        });

        // 5. UI अपडेट करें
        reportTableBody.innerHTML = tableRowsHTML;
        reportTotalsDiv.innerHTML = `
            Total Estimated Payable Salary: <span class="data-total">₹ ${totalPayableSalaryCompany.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            | Total Advance Paid: <span class="data-total">₹ ${totalAdvancePaidCompany.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
        `;
    }

    // इवेंट लिसनर: बटन क्लिक पर रिपोर्ट जेनरेट करें (यदि HTML में बटन है)
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateCompanyReport);
    }
    
    // पेज लोड होने पर तुरंत रिपोर्ट जेनरेट करें
    generateCompanyReport(); 
});