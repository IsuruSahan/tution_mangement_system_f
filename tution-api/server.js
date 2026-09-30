require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Vercel sits in front of this app as a reverse proxy
app.set('trust proxy', 1);

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

// --- Database Connection Cache for Serverless (Vercel) ---
const dbUri = process.env.MONGODB_URI;
mongoose.set('bufferCommands', false);

let cachedConnection = null;

async function connectDB() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        cachedConnection = await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully!');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        cachedConnection = null;
        throw err;
    }
}

if (!dbUri) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI is not defined!');
}

// --- Serverless Middleware to Ensure Connection Before Handling API Routes ---
app.use(async (req, res, next) => {
    if (req.path === '/') {
        return next();
    }

    try {
        if (!dbUri) {
            return res.status(500).json({ message: 'Server configuration error: Database URI missing.' });
        }
        await connectDB();
        if (mongoose.connection.readyState === 1) {
            return next();
        }
    } catch (error) {
        console.error('Database middleware connection failure:', error.message);
    }

    return res.status(503).json({
        message: 'The database is temporarily unavailable. Please try again in a few seconds.'
    });
});

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

// For local testing vs Vercel serverless export
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;