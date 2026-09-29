const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { requireTeacher } = require('../middleware/auth');

router.use(requireTeacher);

// --- CREATE a new attendance record ---
// POST /api/attendance
router.post('/', async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.body.studentId, teacher: req.teacherId });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        const newAttendance = new Attendance({
            teacher: req.teacherId,
            student: req.body.studentId,
            date: new Date(req.body.date),
            status: req.body.status,
            classGrade: student.grade,
            location: student.location
        });
        const savedRecord = await newAttendance.save();
        res.status(201).json(savedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET attendance for a specific class on a specific date ---
// GET /api/attendance/class?date=YYYY-MM-DD&grade=...&location=...
router.get('/class', async (req, res) => {
    try {
        const { date, grade, location } = req.query;
        if (!date || !grade || !location) {
            return res.status(400).json({ message: "Please provide date, grade, and location" });
        }
        const queryDate = new Date(date);
        const startOfDay = new Date(queryDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const records = await Attendance.find({
            teacher: req.teacherId,
            date: { $gte: startOfDay, $lte: endOfDay },
            classGrade: grade,
            location: location
        }).populate('student', 'name');
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- GET all attendance for ONE student (with optional date filtering) ---
// GET /api/attendance/student/:studentId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/student/:studentId', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = { teacher: req.teacherId, student: req.params.studentId };

        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) {
                start.setUTCHours(0, 0, 0, 0);
                filter.date = { $gte: start };
            } else { console.warn(`Invalid startDate: ${startDate}`); }
        }
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) {
                end.setUTCHours(23, 59, 59, 999);
                if (filter.date) {
                    filter.date.$lte = end;
                } else {
                    filter.date = { $lte: end };
                }
            } else { console.warn(`Invalid endDate: ${endDate}`); }
        }

        const records = await Attendance.find(filter).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        console.error("Error fetching student attendance:", err);
        res.status(500).json({ message: 'Error fetching student attendance: ' + err.message });
    }
});

// --- CREATE or UPDATE (UPSERT) an attendance record ---
// POST /api/attendance/mark
router.post('/mark', async (req, res) => {
    try {
        const { studentId, date, status, classGrade, location } = req.body;

        const student = await Student.findOne({ _id: studentId, teacher: req.teacherId });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const recordDate = new Date(date);
        const startOfDay = new Date(recordDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(recordDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const updatedRecord = await Attendance.findOneAndUpdate(
            { teacher: req.teacherId, student: studentId, date: { $gte: startOfDay, $lte: endOfDay } },
            { $set: { status: status, classGrade: classGrade, location: location }, $setOnInsert: { teacher: req.teacherId, student: studentId, date: recordDate } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(201).json(updatedRecord);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- GET ATTENDANCE SUMMARY ---
// GET /api/attendance/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) { return res.status(400).json({ message: 'Start/end date required.' }); }
        const start = new Date(startDate); start.setUTCHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setUTCHours(23, 59, 59, 999);

        const mongoose = require('mongoose');
        const pipeline = [
            { $match: { teacher: new mongoose.Types.ObjectId(req.teacherId), date: { $gte: start, $lte: end }, status: { $in: ['Present', 'Absent'] }, classGrade: { $exists: true, $ne: null, $ne: "" }, location: { $exists: true, $ne: null, $ne: "" } } },
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: false } },
            { $match: { 'studentInfo.isActive': true } },
            { $group: { _id: { grade: '$classGrade', location: '$location', status: '$status' }, count: { $sum: 1 } } },
            { $group: { _id: { grade: '$_id.grade', location: '$_id.location' }, present: { $sum: { $cond: [{ $eq: ['$_id.status', 'Present'] }, '$count', 0] } }, absent: { $sum: { $cond: [{ $eq: ['$_id.status', 'Absent'] }, '$count', 0] } } } },
            { $project: { _id: 0, grade: '$_id.grade', location: '$_id.location', present: '$present', absent: '$absent' } },
            { $sort: { grade: 1, location: 1 } }
        ];
        const summary = await Attendance.aggregate(pipeline);
        res.json(summary);
    } catch (err) { console.error("Error summary:", err); res.status(500).json({ message: 'Error summary: ' + err.message }); }
});

// --- DELETE ALL attendance records for this teacher ---
// DELETE /api/attendance/reset
router.delete('/reset', async (req, res) => {
    try {
        const deleteResult = await Attendance.deleteMany({ teacher: req.teacherId });
        res.json({ message: `Reset attendance. Deleted ${deleteResult.deletedCount} records.`, deletedCount: deleteResult.deletedCount });
    } catch (err) {
        console.error("Error reset attendance:", err);
        res.status(500).json({ message: 'Error reset attendance: ' + err.message });
    }
});

module.exports = router;
