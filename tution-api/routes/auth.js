const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const { JWT_SECRET, requireTeacher } = require('../middleware/auth');

const TOKEN_EXPIRY = '30d';

// --- Rate limiting: prevents brute-forcing a password by hammering the login
// endpoint. 10 attempts per 15 minutes, per IP. Note: since this runs on
// Vercel's serverless functions, the counter resets on cold starts and isn't
// shared across instances - it's a real deterrent, not a hard guarantee.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' }
});

// --- POST /api/auth/teacher/login ---
router.post('/teacher/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
        if (!teacher) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(password, teacher.passwordHash);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (teacher.subscriptionStatus === 'suspended') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }

        const token = jwt.sign({ id: teacher._id, role: 'teacher' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        res.json({
            token,
            teacher: {
                id: teacher._id,
                name: teacher.name,
                businessName: teacher.businessName,
                email: teacher.email,
                subscriptionStatus: teacher.subscriptionStatus
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login error: ' + err.message });
    }
});

// --- POST /api/auth/admin/login ---
router.post('/admin/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(password, admin.passwordHash);
        if (!match) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        res.json({
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login error: ' + err.message });
    }
});

// --- PATCH /api/auth/teacher/change-password ---
// Lets a logged-in teacher change their own password, without needing the admin
// to reset it for them. Requires the current password as proof of identity.
router.patch('/teacher/change-password', requireTeacher, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters.' });
        }

        // req.teacher was attached by requireTeacher middleware
        const match = await bcrypt.compare(currentPassword, req.teacher.passwordHash);
        if (!match) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        req.teacher.passwordHash = await bcrypt.hash(newPassword, 10);
        await req.teacher.save();

        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error changing password: ' + err.message });
    }
});

module.exports = router;
