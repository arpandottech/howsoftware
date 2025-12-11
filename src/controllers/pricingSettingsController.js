const PricingSettings = require('../models/PricingSettings');

// @desc    Get current pricing settings
// @route   GET /api/settings/pricing
// @access  Protected
exports.getSettings = async (req, res, next) => {
    try {
        let settings = await PricingSettings.findOne();
        if (!settings) {
            settings = await PricingSettings.create({
                hourlyRate: 500,
                halfDay: { hours: 5, price: 2500, allowedPersons: 1 },
                fullDay: { hours: 11, price: 5500, allowedPersons: 1 }
            });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};

// @desc    Update pricing settings
// @route   PUT /api/settings/pricing
// @access  Protected
exports.updateSettings = async (req, res, next) => {
    try {
        const { hourlyRate, halfDayPrice, fullDayPrice } = req.body;

        let settings = await PricingSettings.findOne();
        if (!settings) {
            settings = await PricingSettings.create({});
        }

        if (hourlyRate !== undefined) settings.hourlyRate = Number(hourlyRate);

        // Update Half Day / Full Day Prices if provided
        // Note: The structure requires nested updates, or we can just update the prices.
        // If user only provides "Per Hour Per Person Rate", we might want to auto-calculate Half/Full?
        // User said: "if i enter 200 INR so rate is 200 INR".
        // I will allow updating specific fields.

        if (halfDayPrice !== undefined) settings.halfDay.price = Number(halfDayPrice);
        if (fullDayPrice !== undefined) settings.fullDay.price = Number(fullDayPrice);

        await settings.save();

        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};
