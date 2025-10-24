// services/otpService.js
// Production mein Nodemailer ya Twilio jaisi service use karein
const nodemailer = require('nodemailer'); 
require('dotenv').config();

// OTP generation function
function generateOTP() {
    // 6-digit random number
    return Math.floor(100000 + Math.random() * 900000).toString(); 
}

// OTP sending function (Currently a mock)
async function sendOTP(username, otp) {
    // Note: Yahan par aapko user ka email address ya phone number database se fetch karna hoga.
    // Abhi hum sirf 'username' ko ek placeholder man rahe hain.
    
    console.log(`\n==========================================`);
    console.log(`MOCK OTP SERVICE:`);
    console.log(`To User (Placeholder for Email/Phone): ${username}`);
    console.log(`The OTP is: ${otp}`);
    console.log(`(This is a placeholder. You must integrate a real service like Nodemailer/Twilio.)`);
    console.log(`==========================================\n`);

    // ASLI CODE EXAMPLE (Nodemailer se)
    /*
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: username, // Assuming username is the email for simplicity
        subject: 'HOMZON EXCEL SERVICES - Your Login OTP',
        html: `<p>Aapka login OTP hai: <b>${otp}</b>. Yeh 5 minute mein expire ho jaega.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP Email Sent Successfully.');
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
    */
    
    return true; // Assume success for server logic
}

module.exports = { generateOTP, sendOTP };