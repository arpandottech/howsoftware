const PricingSettings = require('../models/PricingSettings');

// @desc    Get current pricing settings (creates default if not exists)
// @route   GET /api/pricing/settings
// @access  Public (or Private)
exports.getPricingSettings = async (req, res, next) => {
    try {
        let settings = await PricingSettings.findOne();

        if (!settings) {
            // Create default if none exists
            settings = await PricingSettings.create({});
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update pricing settings
// @route   PUT /api/pricing/settings
// @access  Private (Admin)
exports.updatePricingSettings = async (req, res, next) => {
    try {
        let settings = await PricingSettings.findOne();

        if (!settings) {
            settings = new PricingSettings(req.body);
        } else {
            // Update fields
            if (req.body.hourlyRate) settings.hourlyRate = req.body.hourlyRate;
            if (req.body.extraPersonRatePerHour) settings.extraPersonRatePerHour = req.body.extraPersonRatePerHour;

            if (req.body.halfDay) {
                settings.halfDay = { ...settings.halfDay, ...req.body.halfDay };
            }
            if (req.body.fullDay) {
                settings.fullDay = { ...settings.fullDay, ...req.body.fullDay };
            }
        }

        const updatedSettings = await settings.save();

        res.status(200).json({
            success: true,
            data: updatedSettings
        });
    } catch (err) {
        next(err);
    }
};
