// seedStudents.js
require('dotenv').config(); // Load .env variables
const mongoose = require('mongoose');
const Student = require('./models/Student'); // Make sure this path is correct

// --- Helper function to generate a random 4-digit ID (1000-9999) ---
function generateStudentId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- Data for random generation ---
const firstNames = ["Sahan", "Isuru", "Dahami", "Nimal", "Kamal", "Sunil", "Priya", "Malith", "Ruwan", "Ayesha", "Kasun", "Chamari", "Mahela", "Kumar", "Lasith", "Thisara", "Anjelo", "Dilshan", "Sanath", "Muthiah"];
const lastNames = ["Perera", "Silva", "Fernando", "Jayasuriya", "Bandara", "Gunarathne", "Kumari", "Senanayake", "Kumara", "Dissanayake"];
const grades = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"];
// --- Your new locations ---
const locations = ["Vishwa - Mawanella", "Sonetto - Mawanella", "Life - Mawanella"];

// Helper to pick a random item from an array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- Main script function ---
async function seedDatabase() {
    // 1. Connect to Database
    // --- TEMPORARILY HARDCODED to your LIVE Atlas DB ---
    const dbUri = "mongodb+srv://12isurukumarasiri_db_user:bxJBU3AiklJINoaF@cluster0.aubmmtx.mongodb.net/tutionDB?retryWrites=true&w=majority&appName=Cluster0";
    
    if (!dbUri) {
        console.error('Error: dbUri string is empty!');
        process.exit(1);
    }
    console.log("Connecting directly to LIVE ATLAS Database...");
    // --- END OF TEMPORARY CHANGE ---

    try {
        await mongoose.connect(dbUri);
        console.log(`Connected to MongoDB Atlas...`);

        // Check if locations exist
        const dbLocations = await mongoose.connection.db.collection('locations').find({}).toArray();
        const locationNames = dbLocations.map(loc => loc.name);
        console.log("Locations found in database:", locationNames);
        
        const allLocationsExist = locations.every(loc => locationNames.includes(loc));
        if (!allLocationsExist) {
            console.error("Error: Not all locations in the script exist in your 'locations' collection.");
            console.log("Please go to your live website's Settings page and add these locations first:", locations);
            await mongoose.disconnect();
            return;
        }
        console.log("Locations verified.");

        console.log('Starting to create 20 random students...');

        for (let i = 0; i < 20; i++) {
            let uniqueIdFound = false;
            let generatedId;
            let attempts = 0;

            while (!uniqueIdFound && attempts < 10) {
                generatedId = generateStudentId();
                const existing = await Student.findOne({ studentId: generatedId });
                if (!existing) {
                    uniqueIdFound = true;
                }
                attempts++;
            }

            if (!uniqueIdFound) {
                console.warn(`Could not find a unique ID for student ${i + 1}, skipping.`);
                continue;
            }

            const student = new Student({
                studentId: generatedId,
                name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
                grade: randomElement(grades),
                location: randomElement(locations),
                contactPhone: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
                parentName: `Parent of ${firstNames[i]}`,
                isActive: true
            });

            await student.save();
            console.log(`Added: ${student.name} (ID: ${student.studentId})`);
        }

        console.log('\n--- Seeding complete! ---');
        console.log('Successfully added 20 random students to the live database.');

    } catch (err) {
        console.error('\nAn error occurred during seeding:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

// Run the script
seedDatabase();