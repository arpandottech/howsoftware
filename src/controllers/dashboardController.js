const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/summary
// // @access Protected
exports.getDashboardSummary = async (req, res, next) => {
    try {
        const { date } = req.query;

        // Determine start and end of the requested date
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // 1. Booking Stats (startTime on that date)
        const bookingStats = await Booking.aggregate([
            {
                $match: {
                    startTime: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    totalGrossRent: { $sum: '$finance.grossAmount' },
                    totalDiscount: { $sum: '$finance.discountAmount' },
                    totalNetRent: { $sum: '$finance.netAmount' },
                    totalRentPaid: { $sum: '$finance.rentPaid' },
                    totalRentDue: { $sum: '$finance.rentDue' }
                }
            }
        ]);

        const bStats = bookingStats[0] || {
            totalBookings: 0,
            totalGrossRent: 0,
            totalDiscount: 0,
            totalNetRent: 0,
            totalRentPaid: 0,
            totalRentDue: 0
        };

        // 2. Payment Stats (paidAt on that date)
        // We need DEPOSIT_IN and DEPOSIT_OUT
        const paymentStats = await Payment.aggregate([
            {
                $match: {
                    paidAt: { $gte: startOfDay, $lte: endOfDay },
                    type: { $in: ['DEPOSIT_IN', 'DEPOSIT_OUT'] }
                }
            },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        let totalDepositCollectedToday = 0;
        let totalDepositReturnedToday = 0;

        paymentStats.forEach(stat => {
            if (stat._id === 'DEPOSIT_IN') {
                totalDepositCollectedToday = stat.totalAmount;
            }
            if (stat._id === 'DEPOSIT_OUT') {
                totalDepositReturnedToday = stat.totalAmount;
            }
        });

        // 3. Active Sessions (status = IN_SESSION)
        // Return: bookingCode, customerName, startTime, endTime, persons
        const activeSessions = await Booking.find({ status: 'IN_SESSION' })
            .select('bookingCode customerName startTime endTime persons')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                date: startOfDay.toISOString().split('T')[0],
                totalBookings: bStats.totalBookings,
                totalGrossRent: bStats.totalGrossRent,
                totalDiscount: bStats.totalDiscount,
                totalNetRent: bStats.totalNetRent,
                totalRentPaid: bStats.totalRentPaid,
                totalRentDue: bStats.totalRentDue,
                totalDepositCollectedToday,
                totalDepositReturnedToday,
                activeSessions
            }
        });

    } catch (err) {
        next(err);
    }
};
