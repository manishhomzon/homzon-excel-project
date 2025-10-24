// server.js
require('dotenv').config(); // .env file se variables load karega
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // CORS middleware import kiya gaya hai

const app = express();
const PORT = process.env.PORT || 3000; 
const mongoURI = process.env.MONGO_URI; 

// CLIENT_ORIGIN ko Environment Variables se liya gaya hai.
// Agar Render par set nahi hai, toh '*' (sabhi ko allow karein) use karein.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*'; 

// ---------------------------------
// Middleware Setup
// ---------------------------------
// CORS ko specific origin ya '*' ke liye allow karein (Render environment ke liye zaroori)
app.use(cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
})); 

app.use(express.json()); // JSON request body ko parse karne ke liye

// ---------------------------------
// DATABASE CONNECTION
// ---------------------------------
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully ✅'))
    .catch(err => {
        console.error('MongoDB connection error ❌:', err);
        process.exit(1); 
    });

// ---------------------------------
// USER MODEL (Schema)
// ---------------------------------
const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: String, 
        default: null 
    }, 
    otpExpires: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// ---------------------------------
// ROUTES
// ---------------------------------
// routes/auth.js file import karein
const authRoutes = require('./routes/auth'); 
app.use('/api', authRoutes(User)); 

// Basic server test route
app.get('/', (req, res) => {
    res.send('HOMZON EXCEL SERVICES Backend Running!');
});

// ---------------------------------
// SERVER START
// ---------------------------------
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Ready for database operations...`);
});