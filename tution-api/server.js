// 1. THIS IS THE MISSING LINE! It must be at the very top.
require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Vercel sits in front of this app as a reverse proxy, so without this,
// express-rate-limit (and req.ip generally) would see Vercel's internal IP
// for every request instead of the real visitor's IP.
app.set('trust proxy', 1);

// Now this log will actually show your URI instead of "undefined"
console.log("🔍 process.env.MONGODB_URI:", process.env.MONGODB_URI ? "✅ Found" : "❌ Still Undefined");
console.log("🔍 process.env.JWT_SECRET:", process.env.JWT_SECRET ? "✅ Found" : "❌ Still Undefined");

// --- Improved CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://tution-mangement-system.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
            return callback(null, true);
        }
        console.error(`CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI is not defined!');
} else {
    console.log("✅ Attempting DB connection...");
    mongoose.connect(dbUri)
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/students', require('./routes/students'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/grades', require('./routes/grades'));

app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        message: 'Tuition API is running!',
        dbConnected: mongoose.connection.readyState === 1
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;