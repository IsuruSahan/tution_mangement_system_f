const router = require('express').Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const { requireTeacher } = require('../middleware/auth');

router.use(requireTeacher);

router.get('/finance', async (req, res) => {
    try {
        const { month, year, grade, location } = req.query;
        const teacherId = new mongoose.Types.ObjectId(req.teacherId);

        // --- 1. Filter Setup ---
        const paymentMatchFilter = { teacher: teacherId, status: 'Paid' };
        if (month && month !== 'All') paymentMatchFilter.month = month;
        if (year && year !== 'All') paymentMatchFilter.year = Number(year);

        const studentMatchFilter = {};
        if (grade && grade !== 'All') studentMatchFilter['studentDetails.grade'] = grade;
        if (location && location !== 'All') studentMatchFilter['studentDetails.location'] = location;

        // --- 2. Advanced Aggregation with Triple Join ---
        const reportData = await Payment.aggregate([
            { $match: paymentMatchFilter },
            // Join 1: Get Student Details
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            { $unwind: '$studentDetails' },
            { $match: studentMatchFilter },
            // Join 2: Get Location Charge Percentage (scoped to this teacher, since names aren't globally unique)
            {
                $lookup: {
                    from: 'locations',
                    let: { locName: '$studentDetails.location', teacherId: '$teacher' },
                    pipeline: [
                        { $match: { $expr: { $and: [{ $eq: ['$name', '$$locName'] }, { $eq: ['$teacher', '$$teacherId'] }] } } }
                    ],
                    as: 'locInfo'
                }
            },
            { $unwind: { path: '$locInfo', preserveNullAndEmptyArrays: true } },
            // Step 3: Calculate Fees and Net for each record
            {
                $addFields: {
                    hallFee: {
                        $multiply: [
                            "$amount",
                            { $divide: [{ $ifNull: ["$locInfo.chargePercentage", 0] }, 100] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    netAmount: { $subtract: ["$amount", "$hallFee"] }
                }
            },
            // Step 4: Group into Final Totals
            {
                $facet: {
                    "breakdown": [
                        {
                            $group: {
                                _id: {
                                    year: '$year',
                                    month: '$month',
                                    grade: '$studentDetails.grade',
                                    location: '$studentDetails.location'
                                },
                                grossIncome: { $sum: '$amount' },
                                totalFees: { $sum: '$hallFee' },
                                netIncome: { $sum: '$netAmount' },
                                studentsPaid: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': -1, '_id.month': 1, '_id.grade': 1 } }
                    ],
                    "grandTotal": [
                        {
                            $group: {
                                _id: null,
                                totalGross: { $sum: '$amount' },
                                totalFees: { $sum: '$hallFee' },
                                totalNet: { $sum: '$netAmount' },
                                totalStudentsPaid: { $sum: 1 }
                            }
                        }
                    ],
                    "paidStudentIds": [
                        { $group: { _id: '$student' } }
                    ]
                }
            }
        ]);

        // --- 3. Unpaid Logic (scoped to this teacher) ---
        let unpaidStudents = [];
        let unpaidCount = 0;
        if (month !== 'All' && year !== 'All') {
            const paidIds = (reportData[0]?.paidStudentIds || []).map(item => item._id);
            const activeClassFilter = { teacher: teacherId, isActive: true };
            if (grade && grade !== 'All') activeClassFilter.grade = grade;
            if (location && location !== 'All') activeClassFilter.location = location;

            unpaidStudents = await Student.find({
                ...activeClassFilter,
                _id: { $nin: paidIds }
            }).select('name studentId grade location contactPhone');

            unpaidCount = unpaidStudents.length;
        }

        res.json({
            breakdown: reportData[0]?.breakdown || [],
            grandTotal: reportData[0]?.grandTotal[0] || { totalGross: 0, totalFees: 0, totalNet: 0 },
            unpaidStudents,
            unpaidCount
        });

    } catch (err) {
        console.error("Finance Report Error:", err);
        res.status(500).json({ message: "Error generating report: " + err.message });
    }
});

module.exports = router;
