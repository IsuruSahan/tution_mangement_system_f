const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A "Teacher" is a tenant of the system - each teacher's data
// (students, payments, attendance, locations) is scoped to their own account.
const teacherSchema = new Schema({
    name: { type: String, required: true, trim: true },
    businessName: { type: String, trim: true }, // e.g. "Silva's Tuition Class"
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },

    // --- Subscription / access control (managed manually by the admin) ---
    subscriptionStatus: {
        type: String,
        enum: ['trial', 'active', 'suspended'],
        default: 'trial'
    },
    notes: { type: String } // admin-only notes, e.g. "paid until Dec 2026"
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;
