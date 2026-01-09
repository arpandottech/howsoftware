const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const total = await Booking.countDocuments();
        const withStudio = await Booking.countDocuments({ photographyName: { $exists: true, $ne: '' } });

        let start = new Date();
        start.setHours(0, 0, 0, 0);
        let end = new Date();
        end.setHours(23, 59, 59, 999);

        const today = await Booking.countDocuments({ startTime: { $gte: start, $lte: end } });
        const studioToday = await Booking.countDocuments({ startTime: { $gte: start, $lte: end }, photographyName: { $exists: true, $ne: '' } });

        // Show actual names and times of today's bookings
        const todayBookings = await Booking.find({ startTime: { $gte: start, $lte: end } }, 'customerName photographyName startTime');

        const fs = require('fs');
        const output = `
Total Bookings: ${total}
With Studio Name: ${withStudio}
Bookings Today (Server Time): ${today}
Bookings Today with Studio: ${studioToday}
Query Start: ${start.toString()}
Query End: ${end.toString()}
Today Bookings List: ${JSON.stringify(todayBookings, null, 2)}
        `;
        fs.writeFileSync('debug_output.txt', output);
        console.log("Written to debug_output.txt");

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
