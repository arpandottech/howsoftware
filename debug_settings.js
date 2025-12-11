const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PricingSettings = require('./src/models/PricingSettings');

dotenv.config();

const checkSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const allSettings = await PricingSettings.find({});
        console.log(`Found ${allSettings.length} setting documents:`);
        allSettings.forEach((s, i) => {
            console.log(`Doc ${i + 1}: ID=${s._id}, Rate=${s.hourlyRate}, HalfDay=${s.halfDay?.hours}/${s.halfDay?.price}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSettings();
