// One-time script to create your super-admin account.
// Run once after deploying: node seedAdmin.js "Your Name" "you@email.com" "yourPassword123"
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
    console.error('Usage: node seedAdmin.js "Your Name" "you@email.com" "yourPassword123"');
    process.exit(1);
}
if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("✅ Connected to DB...");

        const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            console.error(`❌ An admin with email ${email} already exists.`);
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const admin = new Admin({ name, email: email.toLowerCase().trim(), passwordHash });
        await admin.save();

        console.log(`✅ Admin account created for ${email}. You can now log in at /admin/login.`);
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Failed to create admin:", err);
        process.exit(1);
    });
