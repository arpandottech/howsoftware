const { startOfDay, endOfDay, subDays, startOfMonth, startOfYear } = require('date-fns');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const PricingSettings = require('../models/PricingSettings');
const Studio = require('../models/Studio');

// @desc    Search Studios by name prefix
// @route   GET /api/bookings/studios
// @access  Protected
exports.searchStudios = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({ success: true, data: [] });
        }

        const studios = await Studio.find({
            name: { $regex: new RegExp(`^${q}`, 'i') } // Case-insensitive prefix search
        }).limit(10);

        res.status(200).json({
            success: true,
            data: studios
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public (or Protected, depending on requirement - assuming Open/Protected)
exports.createBooking = async (req, res, next) => {
    try {
        const {
            bookingType,
            customerName,

            // coupleName removed

            photographyName,
            phone,
            persons,
            sessionType,
            customHours,
            startTime,
            discountAmount = 0,
            discountReference,
            initialRentPayment = 0,
            advanceTokenAmount = 0,
            paymentMethod
        } = req.body;

        // Auto-Save Studio if unique
        if (photographyName) {
            try {
                // Try to create. If duplicate, it will fail (which is fine).
                await Studio.create({ name: photographyName });
            } catch (err) {
                // Ignore duplicate key error (code 11000)
                if (err.code !== 11000) {
                    console.error("Studio Ops Error:", err);
                }
            }
        }

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
        // User requested dynamic pricing from DB settings
        const ratePerPersonPerHour = settings.hourlyRate;
        const grossAmount = ratePerPersonPerHour * Number(persons) * hours;

        // 5. Discount (Initial Booking Creation: No discount usually, unless we want to keep it? User said remove from booking form)
        // User removed inputs, so discountAmount will be undefined or 0 from frontend.
        // We keep the logic just in case, but it will be 0.
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
            customerName, // This is effectively the Couple Name now

            // coupleName removed

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
                advanceTokenAmount: valAdvanceToken
            },
            createdBy: req.user ? req.user._id : null, // If authenticated
            notes: req.body.notes
        });

        // 10. Create Payments if needed

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
            discountAmount,
            discountReference,
            manualOvertimeAmount,
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

        // Manual Overtime Override
        // If manualOvertimeAmount is provided, we use that.
        // If not, we default to 0 (DISABLE AUTO-APPLY as per user request).
        // The calculated 'extraCharge' above is now just for reference/logging if we wanted, 
        // but effectively we ignore it for the final bill unless user manually sent it.

        if (manualOvertimeAmount !== undefined) {
            extraCharge = Number(manualOvertimeAmount);
        } else {
            // Default to 0 if not provided, ensuring no auto-charge.
            extraCharge = 0;
        }

        // 3. Update Finance (Overtime)
        if (extraCharge > 0) {
            booking.finance.grossAmount += extraCharge;
            // netAmount will be recalculated below
        }

        // 3.5 Update Discount if provided
        // If discountAmount is provided (even if 0), we update it.
        // But frontend sends the *current* total discount desired.
        if (discountAmount !== undefined) {
            booking.finance.discountAmount = Number(discountAmount);
            if (discountReference !== undefined) booking.finance.discountReference = discountReference;
        }

        // Recalculate Net Amount
        // Net = Gross - Discount
        // Note: Gross in DB (finance.grossAmount) has already been updated with extraCharge above.
        booking.finance.netAmount = booking.finance.grossAmount - booking.finance.discountAmount;

        // Recalculate Rent Due
        // rentDue = netAmount - rentPaid
        booking.finance.rentDue = booking.finance.netAmount - booking.finance.rentPaid;

        // 4. Rent Payment at Exit
        const payRent = Number(extraRentPayment) || 0;
        if (payRent !== 0) { // Check for both positive payment and negative refund
            const paymentPayload = {
                bookingId: booking._id,
                type: 'RENT',
                amount: Math.abs(payRent), // Store absolute amount
                createdBy: req.user ? req.user._id : null
            };

            if (payRent > 0) { // Payment to us
                paymentPayload.method = paymentMethod || 'CASH';
            } else { // Refund from us
                paymentPayload.method = 'CASH'; // Default to CASH for refund out.
                paymentPayload.type = 'REFUND'; // Mark as refund
            }

            await Payment.create(paymentPayload);

            booking.finance.rentPaid += payRent; // This will correctly add for payment, subtract for refund
            booking.finance.rentDue = booking.finance.netAmount - booking.finance.rentPaid;
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
        }).sort({ startTime: -1 });

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
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            // Filter by start time range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            query.startTime = { $gte: start, $lte: end };
        }

        const bookings = await Booking.find(query).sort({ startTime: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update booking details
// @route   PUT /api/bookings/:id
// @access  Protected
exports.updateBooking = async (req, res, next) => {
    try {
        const {
            customerName,


            photographyName,
            phone,
            sessionType,
            customHours,
            persons,
            startTime,
            notes,
            grossAmount // New Field which corresponds to "Amount" in UI
        } = req.body;

        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ success: false, error: 'Cannot edit cancelled bookings.' });
        }

        // Update basic fields
        if (customerName) booking.customerName = customerName;


        if (photographyName) booking.photographyName = photographyName;
        if (phone) booking.phone = phone;
        if (notes) booking.notes = notes;

        // Check if session parameters changed
        let recalcNeeded = false;
        if (sessionType && sessionType !== booking.sessionType) recalcNeeded = true;
        if (persons && Number(persons) !== booking.persons) recalcNeeded = true;
        if (startTime && new Date(startTime).getTime() !== new Date(booking.startTime).getTime()) recalcNeeded = true;
        // Custom hours check
        if (sessionType === 'CUSTOM' || booking.sessionType === 'CUSTOM') {
            if (Number(customHours) !== booking.customHours) recalcNeeded = true;
        }
        // Force recalc/update if a specific amount is provided manually
        if (grossAmount !== undefined && Number(grossAmount) !== booking.finance.grossAmount) recalcNeeded = true;

        if (recalcNeeded) {
            // Apply new values for calculation
            const newSessionType = sessionType || booking.sessionType;
            const newPersons = persons ? Number(persons) : booking.persons;
            const newCustomHours = customHours ? Number(customHours) : booking.customHours;
            const newStartTime = startTime ? new Date(startTime) : booking.startTime;

            // 1. Resolve Hours
            let hours = 0;
            switch (newSessionType) {
                case 'ONE_HOUR': hours = 1; break;
                case 'TWO_HOUR': hours = 2; break;
                case 'THREE_HOUR': hours = 3; break;
                case 'HALF_DAY': hours = 5; break; // Use snapshot if possible? logic below uses hardcoded in create
                case 'FULL_DAY': hours = 11; break;
                case 'CUSTOM': hours = newCustomHours || 0; break;
                default: hours = 0;
            }
            // Use snapshot for half/full day hours if available to match creation logic? 
            // Create logic used settings.halfDay.hours. 
            // We should try to respect snapshot if it contains structure definitions, but snapshot only has ratePerPersonPerHour.
            // We'll stick to standard hours definition. 

            // 2. Compute End Time
            const end = new Date(newStartTime.getTime() + hours * 60 * 60 * 1000);

            // 3. Compute Rent (Gross)
            // If explicit grossAmount provided, use it. Otherwise calculate.
            let newGross;
            if (grossAmount !== undefined) {
                newGross = Number(grossAmount);
            } else {
                // Use SNAPSHOT rate to preserve original price agreement
                const rate = booking.pricingSnapshot?.ratePerPersonPerHour || 500;
                newGross = rate * newPersons * hours;
            }

            // 4. Update Financials
            booking.finance.grossAmount = newGross;
            // Net = Gross - Discount (Warning: Discount Amount is fixed. If gross changes, fixed discount stays same)
            booking.finance.netAmount = newGross - booking.finance.discountAmount;

            // Rent Due = Net - Paid
            booking.finance.rentDue = booking.finance.netAmount - booking.finance.rentPaid;

            // Update Booking Fields
            booking.sessionType = newSessionType;
            booking.persons = newPersons;
            booking.customHours = newCustomHours;
            booking.startTime = newStartTime;
            booking.endTime = end;
            booking.hours = hours;
        }

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get Performance Analytics for Studios
// @route   GET /api/bookings/analytics/studios
// @access  Protected
exports.getStudioAnalytics = async (req, res, next) => {
    try {
        const { period } = req.query; // TODAY, YESTERDAY, THIS_MONTH, THIS_YEAR

        // Default to TODAY
        let start = startOfDay(new Date());
        let end = endOfDay(new Date());

        if (period === 'YESTERDAY') {
            const yesterday = subDays(new Date(), 1);
            start = startOfDay(yesterday);
            end = endOfDay(yesterday);
        } else if (period === 'THIS_MONTH') {
            start = startOfMonth(new Date());
            end = endOfDay(new Date());
        } else if (period === 'THIS_YEAR') {
            start = startOfYear(new Date());
            end = endOfDay(new Date());
        }

        const pipeline = [
            {
                $match: {
                    status: { $ne: 'CANCELLED' }, // Ensure we don't count cancelled
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
            },
            {
                $sort: { totalRevenue: -1 }
            },
            {
                $project: {
                    name: "$_id",
                    totalRevenue: 1,
                    bookingCount: 1,
                    _id: 0
                }
            }
        ];

        const stats = await Booking.aggregate(pipeline);

        res.status(200).json({
            success: true,
            data: stats,
            period: { start, end }
        });

    } catch (err) {
        next(err);
    }
};
