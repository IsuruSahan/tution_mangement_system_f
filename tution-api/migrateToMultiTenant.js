// One-time migration: your EXISTING data (students, payments, attendance, locations)
// has no "teacher" field yet. This script creates a Teacher account for your existing
// customer and attaches all of their existing data to that account.
//
// Run once, after deploying the new multi-tenant code:
//   node migrateToMultiTenant.js "Teacher Name" "teacher@email.com" "theirPassword123"
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Payment = require('./models/Payment');
const Attendance = require('./models/Attendance');
const Location = require('./models/Location');

const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
    console.error('Usage: node migrateToMultiTenant.js "Teacher Name" "teacher@email.com" "theirPassword123"');
    process.exit(1);
}
if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("✅ Connected to DB for migration...");

        // Safety check: don't run this twice
        const alreadyMigrated = await Student.countDocuments({ teacher: { $exists: true } });
        if (alreadyMigrated > 0) {
            console.error(`❌ ${alreadyMigrated} student(s) already have a "teacher" field. Migration looks like it already ran - aborting to avoid duplicating work.`);
            process.exit(1);
        }

        const existing = await Teacher.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            console.error(`❌ A teacher with email ${email} already exists.`);
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const teacher = new Teacher({
            name,
            email: email.toLowerCase().trim(),
            passwordHash,
            subscriptionStatus: 'active' // your existing paying customer
        });
        await teacher.save();
        console.log(`✅ Created teacher account: ${teacher.email} (id: ${teacher._id})`);

        const results = await Promise.all([
            Student.updateMany({ teacher: { $exists: false } }, { $set: { teacher: teacher._id } }),
            Payment.updateMany({ teacher: { $exists: false } }, { $set: { teacher: teacher._id } }),
            Attendance.updateMany({ teacher: { $exists: false } }, { $set: { teacher: teacher._id } }),
            Location.updateMany({ teacher: { $exists: false } }, { $set: { teacher: teacher._id } })
        ]);

        console.log(`✅ Migrated ${results[0].modifiedCount} students.`);
        console.log(`✅ Migrated ${results[1].modifiedCount} payments.`);
        console.log(`✅ Migrated ${results[2].modifiedCount} attendance records.`);
        console.log(`✅ Migrated ${results[3].modifiedCount} locations.`);
        console.log(`\n🎉 Done. Existing customer can now log in with email: ${email}`);
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    });
