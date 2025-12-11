const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const PricingSettings = require('../models/PricingSettings');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public (or Protected, depending on requirement - assuming Open/Protected)
exports.createBooking = async (req, res, next) => {
    try {
        const {
            bookingType,
            customerName,
            coupleName,
            photographyName,
            phone,
            persons,
            sessionType,
            customHours,
            startTime,
            discountAmount = 0,
            discountReference,
            depositAmount = 0,
            initialRentPayment = 0,
            advanceTokenAmount = 0,
            paymentMethod
        } = req.body;

        // 1. Load Pricing Settings
        let settings = await PricingSettings.findOne();
        if (!settings) {
            // Create defaults if needed (safety fallback)
            settings = await PricingSettings.create({
                hourlyRate: 500,
                halfDay: { hours: 5, price: 2500, allowedPersons: 1 }, // 500 * 5 = 2500
                fullDay: { hours: 11, price: 5500, allowedPersons: 1 } // 500 * 11 = 5500
            });
        }

        // 2. Resolve Hours
        let hours = 0;
        switch (sessionType) {
            case 'ONE_HOUR': hours = 1; break;
            case 'TWO_HOUR': hours = 2; break;
            case 'THREE_HOUR': hours = 3; break;
            case 'HALF_DAY': hours = 5; break;
            case 'FULL_DAY': hours = 11; break;
            case 'CUSTOM': hours = Number(customHours) || 0; break;
            default: hours = 0;
        }

        if (hours === 0 && sessionType !== 'CUSTOM') {
            // Fallback if something weird happens
            hours = 1;
        }

        // 3. Compute End Time
        const start = new Date(startTime);
        const endTime = new Date(start.getTime() + hours * 60 * 60 * 1000);

        // 4. Compute Rent (Gross)
        // Formula: grossAmount = ratePerPersonPerHour * persons * hours
        // 4. Compute Rent (Gross)
        // Formula: grossAmount = ratePerPersonPerHour * persons * hours
        // User requested dynamic pricing from DB settings
        const ratePerPersonPerHour = settings.hourlyRate;
        const grossAmount = ratePerPersonPerHour * Number(persons) * hours;

        // 5. Discount
        let finalDiscount = Number(discountAmount);
        if (finalDiscount < 0) finalDiscount = 0;
        if (finalDiscount > grossAmount) finalDiscount = grossAmount;

        const netAmount = grossAmount - finalDiscount;

        // 6. Finance
        let valAdvanceToken = 0;
        if (bookingType === 'ADVANCE') {
            valAdvanceToken = Number(advanceTokenAmount) || 0;
        }

        // Initial Rent Payment logic:
        // For Walk-in: initialRentPayment is the rent paid now.
        // For Advance: advanceTokenAmount is usually what they pay now. initialRentPayment might be 0 or same as token.
        // Let's assume for Advance, rentPaid = advanceTokenAmount.
        // For Walk-in, rentPaid = initialRentPayment.

        let rentPaid = 0;
        if (bookingType === 'ADVANCE') {
            rentPaid = valAdvanceToken;
        } else {
            rentPaid = Number(initialRentPayment) || 0;
        }

        const rentDue = netAmount - rentPaid;
        const valDepositAmount = Number(depositAmount) || 0;

        // 7. Booking Code Generation
        // Format: HOW-YYYYMMDD-XXXX
        const dateStr = start.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const prefix = `HOW-${dateStr}-`;

        // Find last booking with this prefix
        const lastBooking = await Booking.findOne({ bookingCode: { $regex: `^${prefix}` } })
            .sort({ bookingCode: -1 });

        let nextSeq = 1;
        if (lastBooking) {
            const parts = lastBooking.bookingCode.split('-');
            const sequence = parseInt(parts[parts.length - 1]);
            if (!isNaN(sequence)) {
                nextSeq = sequence + 1;
            }
        }
        const bookingCode = `${prefix}${String(nextSeq).padStart(4, '0')}`;

        // 8. Status
        let status = 'CONFIRMED';
        if (bookingType === 'WALK_IN') {
            status = 'IN_SESSION';
        }

        // 9. Save Booking
        const booking = await Booking.create({
            bookingCode,
            customerName,
            coupleName,
            photographyName,
            phone,
            persons,
            bookingType,
            sessionType,
            customHours: sessionType === 'CUSTOM' ? Number(customHours) : undefined,
            hours,
            startTime: start,
            endTime,
            status,
            pricingSnapshot: {
                ratePerPersonPerHour: ratePerPersonPerHour,
                halfDayHours: settings.halfDay.hours,
                fullDayHours: settings.fullDay.hours
            },
            finance: {
                grossAmount,
                discountAmount: finalDiscount,
                discountReference,
                netAmount,
                rentPaid,
                rentDue,
                rentDue,
                depositCollected: valDepositAmount,
                depositReturned: 0,
                advanceTokenAmount: valAdvanceToken
            },
            createdBy: req.user ? req.user._id : null, // If authenticated
            notes: req.body.notes
        });

        // 10. Create Payments if needed
        // Deposit Payment
        if (valDepositAmount > 0) {
            await Payment.create({
                bookingId: booking._id,
                type: 'DEPOSIT_IN',
                method: paymentMethod || 'CASH',
                amount: valDepositAmount,
                createdBy: req.user ? req.user._id : null
            });
        }

        // Rent Payment
        if (rentPaid > 0) {
            await Payment.create({
                bookingId: booking._id,
                type: 'RENT',
                method: paymentMethod || 'CASH',
                amount: rentPaid,
                createdBy: req.user ? req.user._id : null
            });
        }

        res.status(201).json({
            success: true,
            data: booking
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Check-In an Advance Booking (Customer Arrived)
// @route   POST /api/bookings/:id/check-in
// @access  Protected
exports.checkIn = async (req, res, next) => {
    try {
        const {
            collectedRent = 0,
            securityDeposit = 0,
            paymentMethod
        } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.bookingType !== 'ADVANCE') {
            return res.status(400).json({ success: false, error: 'Only Advance bookings can be checked in.' });
        }

        if (booking.status !== 'CONFIRMED') {
            return res.status(400).json({ success: false, error: `Booking status is ${booking.status}, cannot check in.` });
        }

        // 1. Update Payments
        if (Number(collectedRent) > 0) {
            await Payment.create({
                bookingId: booking._id,
                type: 'RENT',
                method: paymentMethod || 'CASH',
                amount: Number(collectedRent),
                createdBy: req.user ? req.user._id : null
            });
            booking.finance.rentPaid += Number(collectedRent);
        }

        if (Number(securityDeposit) > 0) {
            await Payment.create({
                bookingId: booking._id,
                type: 'DEPOSIT_IN',
                method: paymentMethod || 'CASH',
                amount: Number(securityDeposit),
                createdBy: req.user ? req.user._id : null
            });
            booking.finance.depositCollected += Number(securityDeposit);
        }

        // 2. Update Stats
        booking.finance.rentDue = booking.finance.netAmount - booking.finance.rentPaid;

        // 3. Update Status
        booking.status = 'IN_SESSION';

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (err) {
        next(err);
    }
};

// @desc    End a session (calculate overtime, payments, close booking)
// @route   POST /api/bookings/:id/end-session
// @access  Protected
exports.endSession = async (req, res, next) => {
    try {
        const {
            exitTime,
            extraRentPayment = 0,
            depositReturnAmount = 0,
            paymentMethod
        } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
            return res.status(400).json({ success: false, error: `Booking is already ${booking.status}` });
        }

        // 1. Determine Actual Exit Time
        const actualExitTime = exitTime ? new Date(exitTime) : new Date();
        booking.actualExitTime = actualExitTime;

        // 2. Calculate Overtime
        // Buffer = 10 mins
        const bufferMinutes = 10;
        const endTime = new Date(booking.endTime);
        const cutoffTime = new Date(endTime.getTime() + bufferMinutes * 60000);

        let extraHours = 0;
        let extraCharge = 0;

        if (actualExitTime > cutoffTime) {
            const diffMs = actualExitTime - cutoffTime;
            const diffMinutes = Math.ceil(diffMs / 60000);
            extraHours = Math.ceil(diffMinutes / 60);

            // Calculate Charge
            // Use rate from snapshot to preserve original pricing agreement
            const rate = booking.pricingSnapshot.ratePerPersonPerHour;
            extraCharge = rate * booking.persons * extraHours;
        }

        // 3. Update Finance (Overtime)
        if (extraCharge > 0) {
            booking.finance.grossAmount += extraCharge;
            booking.finance.netAmount += extraCharge;
            // Note: discountReference is usually for the base booking, so we don't apply discount to overtime usually.
        }

        // Recalculate original rent due before new payments (just to be safe, though simple math works)
        // rentDue = netAmount - rentPaid
        booking.finance.rentDue = booking.finance.netAmount - booking.finance.rentPaid;

        // 4. Rent Payment at Exit
        const payRent = Number(extraRentPayment) || 0;
        if (payRent > 0) {
            await Payment.create({
                bookingId: booking._id,
                type: 'RENT',
                method: paymentMethod || 'CASH',
                amount: payRent,
                createdBy: req.user ? req.user._id : null
            });

            booking.finance.rentPaid += payRent;
            booking.finance.rentDue = booking.finance.netAmount - booking.finance.rentPaid;
        }

        // 5. Deposit Return
        const returnDeposit = Number(depositReturnAmount) || 0;
        if (returnDeposit > 0) {
            await Payment.create({
                bookingId: booking._id,
                type: 'DEPOSIT_OUT', // Returning money to customer
                method: paymentMethod || 'CASH', // Verify if 'method' works for outbound? usually yes
                amount: returnDeposit,
                createdBy: req.user ? req.user._id : null
            });

            booking.finance.depositReturned += returnDeposit;
        }

        // 6. Update Status
        // If fully paid, mark completed.
        // Logic: If rentDue <= 0, completed.
        if (booking.finance.rentDue <= 0) {
            booking.status = 'COMPLETED';
        } else {
            // Maybe still IN_SESSION or just awaiting payment? 
            // Requests logic said: "If finance.rentDue <= 0, set booking status = COMPLETED."
            // Doesn't specify what to do if pending. I'll leave it as is (likely IN_SESSION or CONFIRMED).
            // If it was IN_SESSION, and they are leaving, technically session is done but payment pending.
            // For now, I'll only change to COMPLETED if paid.
        }

        // Save
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            overtime: {
                extraHours,
                extraCharge
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.getTodayBookings = async (req, res, next) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const bookings = await Booking.find({
            startTime: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ startTime: 1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get ALL bookings
// @route   GET /api/bookings
// @access  Protected
exports.getAllBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find().sort({ startTime: 1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};
