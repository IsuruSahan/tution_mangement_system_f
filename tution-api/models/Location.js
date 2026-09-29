const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
    // --- Tenant scoping ---
    teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },

    name: {
        type: String,
        required: true,
        trim: true
    },
    // NEW FIELD: Percentage the location takes (e.g., 10 for 10%)
    chargePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true });

// Location name only needs to be unique within a teacher's own locations.
locationSchema.index({ teacher: 1, name: 1 }, { unique: true });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;