const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Admin = you (the SaaS owner). Separate from Teacher so there's no
// confusion between "runs the platform" and "uses the platform".
const adminSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
