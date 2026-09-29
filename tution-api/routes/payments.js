const router = require('express').Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { requireTeacher } = require('../middleware/auth');

router.use(requireTeacher);

// GET /api/payments/statuslist
router.get('/statuslist', async (req, res) => {
    try {
        const { month, year, grade, location } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required.' });
        }

        // 1. Build student filter (scoped to this teacher)
        const studentFilter = { teacher: req.teacherId, isActive: true };
        if (grade && grade !== 'All') {
            studentFilter.grade = grade;
        }
        if (location && location !== 'All') {
            studentFilter.location = location;
        }

        // 2. Get all students matching the filter
        const students = await Student.find(studentFilter).sort({ name: 1 });

        // 3. Get all payments for the selected month/year (scoped to this teacher)
        const payments = await Payment.find({ teacher: req.teacherId, month, year });

        // 4. Create a Map of payments for fast lookup
        const paymentMap = new Map();
        payments.forEach(payment => {
            paymentMap.set(payment.student.toString(), payment);
        });

        // 5. Combine the lists
        const combinedList = students.map(student => {
            const payment = paymentMap.get(student._id.toString());
            return {
                student: student,
                status: payment ? payment.status : 'Pending',
                paymentId: payment ? payment._id : null,
                amount: payment ? payment.amount : null
            };
        });

        res.json(combinedList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/payments/mark (upsert, scoped to this teacher)
router.post('/mark', async (req, res) => {
    try {
        const { studentId, month, year, status, amount } = req.body;

        // Make sure the student actually belongs to this teacher before touching payments for them
        const student = await Student.findOne({ _id: studentId, teacher: req.teacherId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        const filter = { teacher: req.teacherId, student: studentId, month, year };

        const updateDoc = {
            $set: {
                status: status,
                teacher: req.teacherId,
                student: studentId,
                month: month,
                year: year
            }
        };

        if (amount !== undefined) {
            updateDoc.$set.amount = Number(amount);
        } else if (status === 'Pending') {
            updateDoc.$set.amount = 0;
        } else {
            updateDoc.$setOnInsert = { amount: 0 };
        }

        const updatedPayment = await Payment.findOneAndUpdate(
            filter,
            updateDoc,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(201).json(updatedPayment);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/payments/reset (scoped to this teacher)
router.delete('/reset', async (req, res) => {
    try {
        const deleteResult = await Payment.deleteMany({ teacher: req.teacherId });
        res.json({
            message: `Successfully reset finance data. Deleted ${deleteResult.deletedCount} payment records.`,
            deletedCount: deleteResult.deletedCount
        });
    } catch (err) {
        console.error("Error resetting finance data:", err);
        res.status(500).json({ message: 'Error resetting finance data: ' + err.message });
    }
});

module.exports = router;
