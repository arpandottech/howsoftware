const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { startOfDay, endOfDay, startOfMonth, endOfMonth } = require('date-fns');
const Payment = require('../src/models/Payment');
const Expense = require('../src/models/Expense');

dotenv.config();

const debugFinance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        console.log(`Simulating 'THIS_MONTH': ${start.toISOString()} to ${end.toISOString()}`);

        const payments = await Payment.find({
            paidAt: { $gte: start, $lte: end }
        });

        console.log(`Found ${payments.length} Payments.`);

        let totalIncome = 0;
        let depositsCollected = 0;

        payments.forEach(p => {
            // Log each payment details relevant to logic
            console.log(`ID: ${p._id}, Type: '${p.type}', Method: '${p.method}', Amount: ${p.amount}`);

            if (p.type === 'RENT' || p.method === 'DEPOSIT_DEDUCTION') {
                console.log(" -> Counted as INCOME");
                totalIncome += p.amount;
            } else if (p.type === 'DEPOSIT_IN') {
                console.log(" -> Counted as DEPOSIT_IN");
                depositsCollected += p.amount;
            } else {
                console.log(" -> Ignored/Other");
            }
        });

        console.log("--- RESULT ---");
        console.log(`Total Income: ${totalIncome}`);
        console.log(`Deposits Collected: ${depositsCollected}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugFinance();
