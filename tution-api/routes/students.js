const router = require('express').Router();
const Student = require('../models/Student');
const { requireTeacher } = require('../middleware/auth');

// Every route below is scoped to the logged-in teacher.
router.use(requireTeacher);

// --- Helper function to generate a random 4-digit ID (1000-9999) ---
function generateStudentId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- CREATE a new student ---
// POST /api/students
router.post('/', async (req, res) => {
    try {
        let uniqueIdFound = false;
        let generatedId;
        let attempts = 0; // Prevent infinite loops in unlikely scenarios

        // --- Loop to find an ID unique within THIS teacher's students ---
        while (!uniqueIdFound && attempts < 100) {
            generatedId = generateStudentId();
            const existingStudent = await Student.findOne({ teacher: req.teacherId, studentId: generatedId });
            if (!existingStudent) {
                uniqueIdFound = true;
            }
            attempts++;
        }

        if (!uniqueIdFound) {
            return res.status(500).json({ message: "Could not generate a unique student ID. Please try again." });
        }

        const newStudent = new Student({
            teacher: req.teacherId,
            studentId: generatedId,
            name: req.body.name,
            grade: req.body.grade,
            location: req.body.location,
            contactPhone: req.body.contactPhone,
            parentName: req.body.parentName
            // isActive defaults to true
        });

        const savedStudent = await newStudent.save();
        res.status(201).json(savedStudent);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Failed to generate unique ID or duplicate entry error." });
        }
        res.status(400).json({ message: "Error creating student: " + err.message });
    }
});

// --- GET all students (for the logged-in teacher) ---
// GET /api/students
router.get('/', async (req, res) => {
    try {
        const filter = { teacher: req.teacherId, isActive: true };
        if (req.query.grade && req.query.grade !== 'All') { filter.grade = req.query.grade; }
        if (req.query.location && req.query.location !== 'All') { filter.location = req.query.location; }
        const students = await Student.find(filter).sort({ name: 1 });
        res.json(students);
    } catch (err) {
        console.error("Error fetching students:", err);
        res.status(500).json({ message: 'Error fetching students: ' + err.message });
    }
});

// --- GET one specific student ---
// GET /api/students/:id (using MongoDB _id)
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, teacher: req.teacherId });
        if (student == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        res.json(student);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- UPDATE a student ---
// PATCH /api/students/:id (using MongoDB _id)
router.patch('/:id', async (req, res) => {
    // Note: we don't allow changing studentId or teacher here
    const { studentId, teacher, ...updateData } = req.body;

    try {
        const updatedStudent = await Student.findOneAndUpdate(
            { _id: req.params.id, teacher: req.teacherId },
            updateData,
            { new: true, runValidators: true }
        );
        if (updatedStudent == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        res.json(updatedStudent);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- RESET (Deactivate ALL) students for this teacher ---
// DELETE /api/students/reset
router.delete('/reset', async (req, res) => {
    try {
        const updateResult = await Student.updateMany({ teacher: req.teacherId }, { $set: { isActive: false } });
        res.json({ message: `Successfully deactivated all students. Updated ${updateResult.modifiedCount} student records.`, modifiedCount: updateResult.modifiedCount });
    } catch (err) {
        console.error("Error deactivating all students:", err);
        res.status(500).json({ message: 'Error deactivating all students: ' + err.message });
    }
});

// --- DELETE (Deactivate ONE) student ---
// DELETE /api/students/:id (using MongoDB _id)
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findOne({ _id: req.params.id, teacher: req.teacherId });
        if (student == null) { return res.status(404).json({ message: 'Cannot find student' }); }
        student.isActive = false;
        await student.save();
        res.json({ message: 'Deactivated Student' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- GET student by their 4-digit studentId (scoped to this teacher) ---
// GET /api/students/by-id/1234
router.get('/by-id/:studentId', async (req, res) => {
    try {
        const student = await Student.findOne({
            teacher: req.teacherId,
            studentId: req.params.studentId,
            isActive: true
        });

        if (student == null) {
            return res.status(404).json({ message: 'Cannot find active student with this ID' });
        }
        res.json(student);
    } catch (err) {
        console.error("API Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
