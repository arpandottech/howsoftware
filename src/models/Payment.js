const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    type: {
        type: String,
        enum: ['RENT', 'REFUND'],
        required: true
    },
    method: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD', 'OTHER'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
