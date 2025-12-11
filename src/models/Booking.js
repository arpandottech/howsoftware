const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingCode: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    coupleName: {
        type: String
    },
    photographyName: {
        type: String
    },
    phone: {
        type: String,
        required: true
    },
    persons: {
        type: Number,
        required: true
    },
    bookingType: {
        type: String,
        enum: ['WALK_IN', 'ADVANCE'],
        required: true
    },
    sessionType: {
        type: String,
        enum: ['ONE_HOUR', 'TWO_HOUR', 'THREE_HOUR', 'HALF_DAY', 'FULL_DAY', 'CUSTOM'],
        required: true
    },
    customHours: {
        type: Number
    },
    hours: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    actualExitTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['CONFIRMED', 'IN_SESSION', 'COMPLETED', 'CANCELLED'],
        default: 'CONFIRMED'
    },
    pricingSnapshot: {
        ratePerPersonPerHour: {
            type: Number,
            required: true
        },
        halfDayHours: {
            type: Number
        },
        fullDayHours: {
            type: Number
        }
    },
    finance: {
        grossAmount: {
            type: Number,
            required: true
        },
        discountAmount: {
            type: Number,
            default: 0
        },
        discountReference: {
            type: String
        },
        netAmount: {
            type: Number,
            required: true
        },
        rentPaid: {
            type: Number,
            default: 0
        },
        rentDue: {
            type: Number,
            required: true
        },
        depositCollected: {
            type: Number,
            default: 0
        },
        depositReturned: {
            type: Number,
            default: 0
        },
        advanceTokenAmount: {
            type: Number,
            default: 0
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
