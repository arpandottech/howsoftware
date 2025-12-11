const Expense = require('../models/Expense');
const { startOfDay, endOfDay, startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

// @desc    Get all expenses with filtering and pagination
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, filter = 'ALL', customDate } = req.query;
        const skip = (page - 1) * limit;

        let query = {};

        // Date Filtering Logic
        const today = new Date();
        if (filter === 'TODAY') {
            query.date = {
                $gte: startOfDay(today),
                $lte: endOfDay(today)
            };
        } else if (filter === 'YESTERDAY') {
            query.date = {
                $gte: startOfYesterday(),
                $lte: endOfYesterday()
            };
            query.date = {
                $gte: startOfWeek(today, { weekStartsOn: 1 }), // Monday start
                $lte: endOfWeek(today, { weekStartsOn: 1 })
            };
        } else if (filter === 'THIS_MONTH') {
            query.date = {
                $gte: startOfMonth(today),
                $lte: endOfMonth(today)
            };
        } else if (filter === 'CUSTOM') {
            // Handle Range or Single Date
            const { startDate, endDate } = req.query;
            if (startDate && endDate) {
                query.date = {
                    $gte: startOfDay(new Date(startDate)),
                    $lte: endOfDay(new Date(endDate))
                };
            } else if (customDate) {
                // Fallback for single date if needed, or if user selects same start/end
                const target = new Date(customDate);
                query.date = {
                    $gte: startOfDay(target),
                    $lte: endOfDay(target)
                };
            }
        }

        const expenses = await Expense.find(query)
            .sort({ date: -1 }) // Newest first
            .skip(skip)
            .limit(Number(limit));

        const total = await Expense.countDocuments(query);
        const totalAmount = await Expense.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.status(200).json({
            success: true,
            count: expenses.length,
            total,
            totalAmount: totalAmount[0]?.total || 0,
            data: expenses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res, next) => {
    try {
        const expense = await Expense.create({
            ...req.body,
            date: req.body.date || Date.now()
        });

        res.status(201).json({
            success: true,
            data: expense
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }

        await expense.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
