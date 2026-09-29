const router = require('express').Router();
const Location = require('../models/Location');
const { requireTeacher } = require('../middleware/auth');

router.use(requireTeacher);

// --- GET ALL locations for this teacher ---
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find({ teacher: req.teacherId }).sort({ name: 1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- CREATE a new location ---
router.post('/', async (req, res) => {
    const location = new Location({
        teacher: req.teacherId,
        name: req.body.name,
        chargePercentage: req.body.chargePercentage || 0
    });
    try {
        const newLocation = await location.save();
        res.status(201).json(newLocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- UPDATE a location ---
// PUT /api/locations/12345
router.put('/:id', async (req, res) => {
    try {
        const { name, chargePercentage } = req.body;

        const updatedLocation = await Location.findOneAndUpdate(
            { _id: req.params.id, teacher: req.teacherId },
            {
                name,
                chargePercentage: Number(chargePercentage)
            },
            { new: true, runValidators: true }
        );

        if (!updatedLocation) {
            return res.status(404).json({ message: 'Cannot find location' });
        }

        res.json(updatedLocation);
    } catch (err) {
        res.status(400).json({ message: 'Error updating location: ' + err.message });
    }
});

// --- DELETE a location ---
router.delete('/:id', async (req, res) => {
    try {
        const deletedLocation = await Location.findOneAndDelete({ _id: req.params.id, teacher: req.teacherId });
        if (deletedLocation == null) {
            return res.status(404).json({ message: 'Cannot find location' });
        }
        res.json({ message: 'Deleted Location' });
    } catch (err) {
        console.error("Error deleting location:", err);
        res.status(500).json({ message: 'Error deleting location: ' + err.message });
    }
});

module.exports = router;
