const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const bookings = await mongoose.connection.db.collection('bookings').find({}).toArray();
        console.log(`--- FOUND ${bookings.length} BOOKINGS ---`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log(`TODAY (Midnight): ${today.toISOString()}`);

        bookings.forEach((b, i) => {
            const d = new Date(b.startDate);
            const isFuture = d >= today;
            console.log(`[${i}] Name: "${b.customerName}" | Date: ${b.startDate} (ISO: ${d.toISOString()}) | Future? ${isFuture}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
