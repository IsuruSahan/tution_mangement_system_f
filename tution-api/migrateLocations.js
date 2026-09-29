require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('./models/Location');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("✅ Connected to DB for migration...");
        
        // Update all locations that don't have a chargePercentage to 0 (or your choice)
        const result = await Location.updateMany(
            { chargePercentage: { $exists: false } },
            { $set: { chargePercentage: 0 } }
        );

        console.log(`✅ Updated ${result.modifiedCount} locations.`);
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    });