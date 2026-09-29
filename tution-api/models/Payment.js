const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    // --- Tenant scoping ---
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },

    // This is how we link this payment to a specific student
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true }, 

    month: { type: String, required: true }, // e.g., "October"
    year: { type: Number, required: true }, // e.g., 2025
   amount: { type: Number },
    status: { 
        type: String, 
        enum: ['Paid', 'Pending', 'Overdue'], // Only allows these values
        default: 'Pending' 
    }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;


