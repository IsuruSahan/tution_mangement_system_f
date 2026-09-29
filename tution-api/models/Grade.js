const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A "Grade" is really just a class/batch label a teacher defines for
// themselves - "Grade 6", "Revision 2026", "Theory 2026", whatever they
// actually call their classes. Kept as its own teacher-managed list
// (same pattern as Location) instead of a fixed set of options.
const gradeSchema = new Schema({
    // --- Tenant scoping ---
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },

    name: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

// Grade name only needs to be unique within a teacher's own grades.
gradeSchema.index({ teacher: 1, name: 1 }, { unique: true });

const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade;
