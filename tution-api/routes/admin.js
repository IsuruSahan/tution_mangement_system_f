const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Every route in this file requires a valid admin token.
router.use(requireAdmin);

// --- GET /api/admin/teachers - list all teachers with basic usage stats ---
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find().sort({ createdAt: -1 }).select('-passwordHash');

        // Attach a student count to each teacher so the admin can see usage at a glance
        const teachersWithStats = await Promise.all(
            teachers.map(async (teacher) => {
                const studentCount = await Student.countDocuments({ teacher: teacher._id, isActive: true });
                return { ...teacher.toObject(), studentCount };
            })
        );

        res.json(teachersWithStats);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching teachers: ' + err.message });
    }
});

// --- POST /api/admin/teachers - create a new teacher account ---
router.post('/teachers', async (req, res) => {
    try {
        const { name, businessName, email, password, phone, subscriptionStatus } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }

        const existing = await Teacher.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ message: 'A teacher with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const teacher = new Teacher({
            name,
            businessName,
            email: email.toLowerCase().trim(),
            passwordHash,
            phone,
            subscriptionStatus: subscriptionStatus || 'trial'
        });

        const saved = await teacher.save();
        const { passwordHash: _, ...safeTeacher } = saved.toObject();
        res.status(201).json(safeTeacher);
    } catch (err) {
        res.status(400).json({ message: 'Error creating teacher: ' + err.message });
    }
});

// --- PATCH /api/admin/teachers/:id - update a teacher (status, notes, details, or reset password) ---
router.patch('/teachers/:id', async (req, res) => {
    try {
        const { name, businessName, phone, subscriptionStatus, notes, newPassword } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (businessName !== undefined) update.businessName = businessName;
        if (phone !== undefined) update.phone = phone;
        if (subscriptionStatus !== undefined) update.subscriptionStatus = subscriptionStatus;
        if (notes !== undefined) update.notes = notes;
        if (newPassword) {
            if (newPassword.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters.' });
            }
            update.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        const teacher = await Teacher.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-passwordHash');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }
        res.json(teacher);
    } catch (err) {
        res.status(400).json({ message: 'Error updating teacher: ' + err.message });
    }
});

// --- DELETE /api/admin/teachers/:id - permanently remove a teacher and ALL their data ---
router.delete('/teachers/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        // Clean up every collection scoped to this teacher.
        const Payment = require('../models/Payment');
        const Attendance = require('../models/Attendance');
        const Location = require('../models/Location');

        await Promise.all([
            Student.deleteMany({ teacher: teacher._id }),
            Payment.deleteMany({ teacher: teacher._id }),
            Attendance.deleteMany({ teacher: teacher._id }),
            Location.deleteMany({ teacher: teacher._id }),
            Teacher.findByIdAndDelete(teacher._id)
        ]);

        res.json({ message: `Teacher "${teacher.name}" and all their data have been deleted.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting teacher: ' + err.message });
    }
});

module.exports = router;
