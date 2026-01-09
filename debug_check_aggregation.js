const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const dotenv = require('dotenv');
const { startOfDay, endOfDay } = require('date-fns');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Exact logic from Controller (TODAY default)
        let start = startOfDay(new Date());
        let end = endOfDay(new Date());

        console.log("Start:", start);
        console.log("End:", end);

        const pipeline = [
            {
                $match: {
                    status: { $ne: 'CANCELLED' },
                    startTime: { $gte: start, $lte: end },
                    photographyName: { $exists: true, $ne: '' }
                }
            },
            {
                $group: {
                    _id: "$photographyName",
                    totalRevenue: { $sum: "$finance.netAmount" },
                    bookingCount: { $sum: 1 }
                }
            }
        ];

        console.log("Pipeline Match:", JSON.stringify(pipeline[0].$match, null, 2));

        const stats = await Booking.aggregate(pipeline);
        console.log("Aggregation Result:", JSON.stringify(stats, null, 2));

        // Sanity Check: Count documents matching strictly
        const count = await Booking.countDocuments(pipeline[0].$match);
        console.log("Matching Documents Count:", count);

        if (count === 0) {
            // Look for *any* booking today to see why it failed
            const anyToday = await Booking.find({ startTime: { $gte: start, $lte: end } }).limit(2);
            console.log("Any Booking Today?:", JSON.stringify(anyToday, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
run();
