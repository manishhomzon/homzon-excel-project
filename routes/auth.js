// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs'); // Password hashing ke liye
// OTP service import karein
const { sendOTP, generateOTP } = require('../services/otpService'); 

// User Model ko parameter ke roop mein pass kiya jaega
module.exports = (User) => {
    const router = express.Router();

    // POST /api/register
    router.post('/register', async (req, res) => {
        try {
            const { username, password } = req.body;
            
            // Validation: Check karein ki username aur password hai ya nahi
            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Username and password are required.' });
            }

            // Password Hashing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            const newUser = new User({ 
                username, 
                password: hashedPassword 
            });

            await newUser.save();
            res.status(201).json({ success: true, message: 'User registered successfully. Please login.' });

        } catch (error) {
            if (error.code === 11000) { // Duplicate key error (username already exists)
                return res.status(409).json({ success: false, message: 'Username already exists. Please choose a different one.' });
            }
            console.error('Registration Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error during registration.' });
        }
    });

    // POST /api/login (Phase 1: Credentials check + OTP generation)
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid Username or Password.' });
            }

            // Generate OTP
            const otp = generateOTP(); 
            const otpExpires = new Date(Date.now() + 5 * 60000); // 5 minutes validity

            // Save OTP to DB
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            // Send OTP (Email/SMS service yahan call hoga)
            await sendOTP(username, otp); 

            res.json({ success: true, message: 'Login successful! OTP sent for verification.' });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ success: false, message: 'Server error during login process.' });
        }
    });

    // POST /api/verify-otp (Phase 2: OTP verification)
    router.post('/verify-otp', async (req, res) => {
        const { username, otp } = req.body;
        try {
            const user = await User.findOne({ username });

            if (!user || user.otp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid OTP.' });
            }

            // Check for expiry
            if (user.otpExpires < new Date()) {
                return res.status(400).json({ success: false, message: 'OTP Expired. Please login again.' });
            }

            // OTP is valid and not expired, clear it from DB for security
            user.otp = null;
            user.otpExpires = null;
            await user.save();

            // Yahan par aap JWT (JSON Web Token) ya session generate kar sakte hain
            res.json({ success: true, message: 'OTP verified. Access granted.', token: 'JWT_TOKEN_HERE' });

        } catch (error) {
            console.error('OTP Verification Error:', error);
            res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
        }
    });

    return router;
};