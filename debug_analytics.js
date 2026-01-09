const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const dotenv = require('dotenv');

dotenv.config();

const checkBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const bookings = await Booking.find({}, 'customerName photographyName startTime status finance.netAmount').sort({ startTime: -1 }).limit(10);

        console.log("Recent Bookings:");
        bookings.forEach(b => {
            console.log(`- ${b.customerName} | Studio: '${b.photographyName}' | Date: ${b.startTime} | Status: ${b.status}`);
        });

        // Test Aggregation for TODAY
        let start = new Date();
        start.setHours(0, 0, 0, 0);
        let end = new Date();
        end.setHours(23, 59, 59, 999);

        console.log("\nQuery Range (Local/System):");
        console.log("Start:", start);
        console.log("End:", end);

        const count = await Booking.countDocuments({
            startTime: { $gte: start, $lte: end },
            photographyName: { $exists: true, $ne: '' }
        });
        console.log(`\nMatching 'TODAY' count: ${count}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBookings();
