const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    // --- Tenant scoping: which teacher this student belongs to ---
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },

    // --- NEW FIELD ---
    studentId: {
        type: String, // Store as string for leading zeros if needed, though 4-digits won't have them
        required: true,
        index: true   // Improves lookup performance for this field
    },
    // --- Existing Fields ---
    name: { type: String, required: true, trim: true },
    grade: { type: String, required: true },
    location: { type: String, required: true },
    contactPhone: { type: String },
    parentName: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// studentId only needs to be unique WITHIN a teacher's own students now -
// two different teachers can both have a student with ID "1234".
studentSchema.index({ teacher: 1, studentId: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;