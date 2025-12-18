const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Booking = require('./src/models/Booking');

dotenv.config();
connectDB();

const resetBookings = async () => {
    try {
        console.log('⚠ WARNING: This will delete ALL Booking entries.');
        console.log('Starting deletion process...');

        const result = await Booking.deleteMany({}); // Deletes all documents in Booking collection

        console.log(`✅ Success! Deleted ${result.deletedCount} booking entries.`);
        console.log('Other data (Users, Expenses, etc.) remains intact.');

        process.exit();
    } catch (error) {
        console.error('❌ Error clearing bookings:', error);
        process.exit(1);
    }
};

// Add a 5-second delay to allow user to cancel if they ran it by accident
console.log('waiting 5 seconds... ctrl+c to cancel');
setTimeout(resetBookings, 5000);
