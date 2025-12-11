const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, format } = require('date-fns');

// @desc    Get finance stats (Income, Expense, Profit, Deposits)
// @route   GET /api/finance
// @access  Private
exports.getFinanceStats = async (req, res, next) => {
    try {
        const { startDate, endDate, filter } = req.query;
        let dateQuery = {};

        // 1. Determine Date Range
        const now = new Date();
        if (startDate && endDate) {
            dateQuery = {
                $gte: startOfDay(new Date(startDate)),
                $lte: endOfDay(new Date(endDate))
            };
        } else if (filter === 'TODAY') {
            dateQuery = { $gte: startOfDay(now), $lte: endOfDay(now) };
        } else if (filter === 'YESTERDAY') {
            dateQuery = { $gte: startOfDay(subDays(now, 1)), $lte: endOfDay(subDays(now, 1)) };
        } else if (filter === 'THIS_MONTH') {
            dateQuery = { $gte: startOfMonth(now), $lte: endOfMonth(now) };
        } else {
            // Default to THIS MONTH if nothing selected? Or maybe last 30 days?
            // Let's default to THIS MONTH for overview
            dateQuery = { $gte: startOfMonth(now), $lte: endOfMonth(now) };
        }

        // 2. Fetch Payments (Income & Deposits) matching Date
        // Note: For "Deposit Held", we might want TOTAL held regardless of date, 
        // BUT usually finance dashboards show "Movement" in that period. 
        // User asked for "Deposit separate, not count in income". 
        // So we will show: 
        // - Income: RENT + DEPOSIT_DEDUCTION in this period.
        // - Expenses: Expenses from module + DEPOSIT_OUT/REFUND? 
        //   Actually, DEPOSIT_OUT is returning user's money, not strictly an "Expense" (Profit Loss).
        //   Real Expense is 'Expense' model. 
        //   Let's stick to Operational Expense for "Total Expense".
        //   And show "Net Cash Flow" or "Profit". 
        //   Profit = Realized Income - Operational Expense.

        const payments = await Payment.find({
            paidAt: dateQuery
        }).populate('bookingId', 'customerName bookingCode');

        const expenses = await Expense.find({
            date: dateQuery
        });

        // 3. Aggregate Data
        let totalIncome = 0;
        let totalExpense = 0;
        let depositsCollected = 0;
        let depositsReturned = 0;

        // Process Payments
        const incomeTransactions = [];
        const depositTransactions = [];

        payments.forEach(p => {
            const amount = p.amount;

            // Income Logic: RENT or DEPOSIT_DEDUCTION
            if (p.type === 'RENT' || p.method === 'DEPOSIT_DEDUCTION') {
                totalIncome += amount;
                incomeTransactions.push({
                    id: p._id,
                    date: p.paidAt,
                    description: p.bookingId ? `Booking ${p.bookingId.bookingCode} - ${p.bookingId.customerName}` : 'Payment',
                    category: 'Income',
                    type: 'INCOME', // For UI Color
                    amount: amount
                });
            }

            // Deposit Logic
            if (p.type === 'DEPOSIT_IN') {
                depositsCollected += amount;
                depositTransactions.push({
                    id: p._id,
                    date: p.paidAt,
                    description: p.bookingId ? `Deposit - ${p.bookingId.customerName}` : 'Deposit In',
                    category: 'Deposit',
                    type: 'DEPOSIT_IN',
                    amount: amount
                });
            } else if (p.type === 'DEPOSIT_OUT') {
                depositsReturned += amount;
                depositTransactions.push({
                    id: p._id,
                    date: p.paidAt,
                    description: p.bookingId ? `Refund - ${p.bookingId.customerName}` : 'Deposit Refund',
                    category: 'Refund',
                    type: 'DEPOSIT_OUT',
                    amount: -amount // Negative for flow
                });
            }
        });

        // Process Expenses
        const expenseTransactions = expenses.map(e => {
            totalExpense += e.amount;
            return {
                id: e._id,
                date: e.date,
                description: e.note,
                category: e.category,
                type: 'EXPENSE',
                amount: e.amount
            };
        });

        // netProfit
        const netProfit = totalIncome - totalExpense;

        // Held Deposit (Net flow in this period)
        const netDepositFlow = depositsCollected - depositsReturned;

        // 4. Merge & Sort Transactions
        // We only show Income and Expense in main list? Or everything?
        // User wants "Finance Module", so everything dealing with money is good.
        // We can color code them.
        const allTransactions = [...incomeTransactions, ...expenseTransactions, ...depositTransactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // 5. Build Chart Data (Daily breakdown)
        // Map dates to Income/Expense
        const dailyMap = new Map();

        allTransactions.forEach(t => {
            const dayKey = format(new Date(t.date), 'yyyy-MM-dd');
            if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { date: dayKey, income: 0, expense: 0 });

            const dayData = dailyMap.get(dayKey);
            if (t.type === 'INCOME') {
                dayData.income += t.amount;
            } else if (t.type === 'EXPENSE') {
                dayData.expense += t.amount;
            }
        });

        // Convert Map to Array and Sort
        const chartData = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            stats: {
                totalIncome,
                totalExpense,
                netProfit,
                netDepositFlow,
                depositsCollected,
                depositsReturned
            },
            chartData,
            recentTransactions: allTransactions
        });

    } catch (err) {
        next(err);
    }
};
