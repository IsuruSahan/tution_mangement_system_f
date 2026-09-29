// One-time migration: "Grade" used to be a fixed dropdown (Grade 6-11) in the
// frontend. It's now a teacher-managed list (like Locations), stored in its
// own collection. This script looks at each teacher's EXISTING students,
// finds every distinct grade/class label they've already used (e.g. "Grade 6",
// "Revision 2026", "Theory 2026" - whatever they typed), and creates a Grade
// entry for each one, so nothing disappears from their dropdowns after this update.
//
// Safe to run more than once - it skips grades that already exist.
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Grade = require('./models/Grade');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("✅ Connected to DB for grade backfill...");

        // Group distinct grade values per teacher directly in the DB.
        const distinctGrades = await Student.aggregate([
            { $match: { grade: { $exists: true, $ne: null, $ne: '' } } },
            { $group: { _id: { teacher: '$teacher', grade: '$grade' } } }
        ]);

        console.log(`Found ${distinctGrades.length} distinct (teacher, grade) pair(s) across all students.`);

        let created = 0;
        let skipped = 0;

        for (const item of distinctGrades) {
            const { teacher, grade } = item._id;
            if (!teacher || !grade) { skipped++; continue; }

            try {
                await Grade.create({ teacher, name: grade });
                created++;
            } catch (err) {
                if (err.code === 11000) {
                    skipped++; // already exists for this teacher - fine
                } else {
                    console.error(`Failed to create grade "${grade}" for teacher ${teacher}:`, err.message);
                }
            }
        }

        console.log(`✅ Done. Created ${created} grade(s), skipped ${skipped} (already existed or invalid).`);
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Backfill failed:", err);
        process.exit(1);
    });
