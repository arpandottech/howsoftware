const mongoose = require('mongoose');

const pricingSettingsSchema = new mongoose.Schema({
    hourlyRate: {
        type: Number,
        required: true,
        default: 500 // Fallback default
    },
    extraPersonRatePerHour: {
        type: Number,
        required: true,
        default: 500
    },
    halfDay: {
        hours: {
            type: Number,
            default: 5,
            required: true
        },
        price: {
            type: Number,
            default: 12000,
            required: true
        },
        allowedPersons: {
            type: Number,
            default: 8,
            required: true
        }
    },
    fullDay: {
        hours: {
            type: Number,
            default: 11,
            required: true
        },
        price: {
            type: Number,
            default: 20000,
            required: true
        },
        allowedPersons: {
            type: Number,
            default: 8,
            required: true
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PricingSettings', pricingSettingsSchema);
