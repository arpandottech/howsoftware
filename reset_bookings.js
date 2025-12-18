const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const Booking = require('./src/models/Booking');
const Expense = require('./src/models/Expense');
const Payment = require('./src/models/Payment');

dotenv.config();
connectDB();

const resetData = async () => {
    try {
        console.log('⚠ WARNING: This will delete ALL Booking, Expense, and Payment entries.');
        console.log('Users and Roles will remain INTACDT.');
        console.log('Starting deletion process...');

        const bookingResult = await Booking.deleteMany({});
        const expenseResult = await Expense.deleteMany({});
        const paymentResult = await Payment.deleteMany({});

        console.log('------------------------------------------------');
        console.log(`✅ Deleted ${bookingResult.deletedCount} Bookings.`);
        console.log(`✅ Deleted ${expenseResult.deletedCount} Expenses.`);
        console.log(`✅ Deleted ${paymentResult.deletedCount} Payments.`);
        console.log('------------------------------------------------');
        console.log('System is now clean of transaction data.');

        process.exit();
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

// Add a 5-second delay to allow user to cancel
console.log('waiting 5 seconds... ctrl+c to cancel');
setTimeout(resetData, 5000);
