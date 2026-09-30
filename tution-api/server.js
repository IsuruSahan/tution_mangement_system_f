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

// --- Database Connection Cache & Queue for Serverless (Vercel) ---
const dbUri = process.env.MONGODB_URI;
mongoose.set('bufferCommands', false);

let isConnecting = false;

async function ensureDBConnected() {
    if (mongoose.connection.readyState === 1) {
        return true;
    }

    if (isConnecting) {
        // If another incoming request is already attempting connection, wait for it
        let retries = 30; // Wait up to 3 seconds total
        while (retries > 0 && mongoose.connection.readyState !== 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries--;
        }
        return mongoose.connection.readyState === 1;
    }

    try {
        isConnecting = true;
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully!');
        isConnecting = false;
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        isConnecting = false;
        return false;
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

    if (!dbUri) {
        return res.status(500).json({ message: 'Server configuration error: Database URI missing.' });
    }

    const connected = await ensureDBConnected();

    if (connected && mongoose.connection.readyState === 1) {
        return next();
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