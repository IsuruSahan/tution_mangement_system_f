const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    // --- Tenant scoping ---
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },

    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true }, // The date of the class
    status: { 
        type: String, 
        enum: ['Present', 'Absent'], 
        default: 'Absent' 
    },
    classGrade: { type: String }, // Storing the grade here makes queries faster
    location: { type: String } // Storing location here makes queries faster
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;