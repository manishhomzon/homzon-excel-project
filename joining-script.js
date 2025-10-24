document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('employeeJoiningForm');
    const photoInput = document.getElementById('employeePhoto');
    const photoPreview = document.getElementById('profilePhotoPreview');
    const companyNameDisplay = document.getElementById('companyNameDisplay');

    // फोटो प्रीव्यू लॉजिक (यह HTML में भी डाला गया है, लेकिन यहाँ दोहराया जा रहा है यदि आप external स्क्रिप्ट का उपयोग करते हैं)
    photoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
            }
            reader.readAsDataURL(file);
        } else {
            photoPreview.src = "default-profile.png"; 
        }
    });

    // फॉर्म सबमिशन और डेटा सेव
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Unique ID के लिए कोई फ़ील्ड निर्दिष्ट नहीं है, इसलिए हम एक अस्थायी ID उपयोग कर सकते हैं या इसे छोड़ सकते हैं।
        // Joining Form में Employee ID बाद में भी आ सकता है। हम नाम और तारीख के आधार पर सेव करेंगे।
        
        // लोकल स्टोरेज से मौजूदा डेटा लोड करें
        const employees = JSON.parse(localStorage.getItem('employees')) || [];
        
        const reader = new FileReader();
        const photoFile = photoInput.files[0];
        
        if (photoFile) {
            reader.readAsDataURL(photoFile);
        }
        
        reader.onloadend = function() {
            const photoBase64 = reader.result || photoPreview.src; 
            
            // नया Employee ऑब्जेक्ट बनाएँ
            const newEmployee = {
                // फॉर्म डेटा
                companyName: companyNameDisplay.textContent,
                name: document.getElementById('name').value,
                dob: document.getElementById('dob').value,
                fatherName: document.getElementById('fatherName').value,
                fatherOccupation: document.getElementById('fatherOccupation').value,
                motherName: document.getElementById('motherName').value,
                motherOccupation: document.getElementById('motherOccupation').value,
                qualification: document.getElementById('qualification').value,
                experience: document.getElementById('experience').value,
                address: document.getElementById('address').value,
                thana: document.getElementById('thana').value,
                contactNo: document.getElementById('contactNo').value,
                altContactNo: document.getElementById('altContactNo').value,
                postApplied: document.getElementById('postApplied').value,
                salaryGranted: document.getElementById('salaryGranted').value,
                
                // फोटो डेटा (Base64 स्ट्रिंग)
                photo: photoBase64 
            };

            // Array में नया Employee जोड़ें (भविष्य के संदर्भ के लिए)
            employees.push(newEmployee);
            
            // Local Storage में सेव करें
            localStorage.setItem('joiningFormRecords', JSON.stringify(employees));

            alert(`✅ Joining Form for ${newEmployee.name} saved successfully under ${newEmployee.companyName}.`);
            
            // फॉर्म रीसेट करें
            form.reset();
            photoPreview.src = "default-profile.png";
            document.getElementById('companySelector').value = "HOMZON EXCEL SERVICES PVT. LTD.";
            companyNameDisplay.textContent = "HOMZON EXCEL SERVICES PVT. LTD.";
        };
        
        if (!photoFile) {
            reader.onloadend(); 
        }
    });
});