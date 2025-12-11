const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Please add an amount']
    },
    note: {
        type: String,
        required: [true, 'Please add a note']
    },
    date: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        default: 'General'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
