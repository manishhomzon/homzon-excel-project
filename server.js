// server.js
require('dotenv').config(); // .env file se variables load karega
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

// ---------------------------------
// CORS Setup (Render + Frontend Support)
// ---------------------------------
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// ---------------------------------
// DATABASE CONNECTION
// ---------------------------------
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ---------------------------------
// USER MODEL
// ---------------------------------
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

// ---------------------------------
// ROUTES IMPORT
// ---------------------------------
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes(User));

// ---------------------------------
// TEST ROUTE
// ---------------------------------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 HOMZON EXCEL SERVICES Backend is Running!',
  });
});

// ---------------------------------
// ERROR HANDLER (Global)
// ---------------------------------
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// ---------------------------------
// START SERVER
// ---------------------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Ready for connections`);
});
