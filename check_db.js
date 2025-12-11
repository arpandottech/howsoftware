const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const checkDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const bookings = await mongoose.connection.db.collection('bookings').find({}).toArray();
        console.log(`\nTotal Bookings: ${bookings.length}`);

        console.log("\nListing Bookings:");
        bookings.forEach(b => {
            console.log(`- Name: ${b.customerName}, Date: ${b.startDate}, Status: ${b.status}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
