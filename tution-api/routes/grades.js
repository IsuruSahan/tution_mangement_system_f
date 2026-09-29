const router = require('express').Router();
const Grade = require('../models/Grade');
const { requireTeacher } = require('../middleware/auth');

router.use(requireTeacher);

// --- GET ALL grades for this teacher ---
router.get('/', async (req, res) => {
    try {
        const grades = await Grade.find({ teacher: req.teacherId }).sort({ name: 1 });
        res.json(grades);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- CREATE a new grade ---
router.post('/', async (req, res) => {
    const grade = new Grade({
        teacher: req.teacherId,
        name: req.body.name
    });
    try {
        const newGrade = await grade.save();
        res.status(201).json(newGrade);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You already have a grade/class with this name.' });
        }
        res.status(400).json({ message: err.message });
    }
});

// --- UPDATE a grade (renames it - does NOT touch existing students already using the old name) ---
// PUT /api/grades/12345
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;

        const updatedGrade = await Grade.findOneAndUpdate(
            { _id: req.params.id, teacher: req.teacherId },
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedGrade) {
            return res.status(404).json({ message: 'Cannot find grade' });
        }

        res.json(updatedGrade);
    } catch (err) {
        res.status(400).json({ message: 'Error updating grade: ' + err.message });
    }
});

// --- DELETE a grade (only removes it from the list - existing students keep their grade text) ---
router.delete('/:id', async (req, res) => {
    try {
        const deletedGrade = await Grade.findOneAndDelete({ _id: req.params.id, teacher: req.teacherId });
        if (deletedGrade == null) {
            return res.status(404).json({ message: 'Cannot find grade' });
        }
        res.json({ message: 'Deleted Grade' });
    } catch (err) {
        console.error("Error deleting grade:", err);
        res.status(500).json({ message: 'Error deleting grade: ' + err.message });
    }
});

module.exports = router;
