const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PricingSettings = require('./src/models/PricingSettings');

dotenv.config();

const resetSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Force update the first document found
        const res = await PricingSettings.updateMany({}, {
            $set: {
                hourlyRate: 500,
                'halfDay.hours': 5,
                'halfDay.price': 2500,
                'fullDay.hours': 11,
                'fullDay.price': 5500
            }
        });

        console.log("Reset result:", res);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetSettings();
