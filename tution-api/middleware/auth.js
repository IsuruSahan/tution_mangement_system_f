const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');

const JWT_SECRET = process.env.JWT_SECRET;

function getTokenFromHeader(req) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;
    return header.split(' ')[1];
}

// --- Protects teacher-facing routes (students, payments, attendance, locations, dashboard, reports) ---
// Verifies the JWT, then re-checks the teacher's subscription status against the DB on every
// request (not just at login time) so a suspended teacher is locked out immediately.
async function requireTeacher(req, res, next) {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ message: 'No token provided. Please log in.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'teacher') {
            return res.status(403).json({ message: 'Not authorized as a teacher.' });
        }

        const teacher = await Teacher.findById(decoded.id);
        if (!teacher) {
            return res.status(401).json({ message: 'Account not found.' });
        }
        if (teacher.subscriptionStatus === 'suspended') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }

        // Attach for use in route handlers
        req.teacherId = teacher._id.toString();
        req.teacher = teacher;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
}

// --- Protects admin-only routes (managing teachers) ---
function requireAdmin(req, res, next) {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ message: 'No token provided. Please log in.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as an admin.' });
        }

        req.adminId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
    }
}

module.exports = { requireTeacher, requireAdmin, JWT_SECRET };
