const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a role name'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    permissions: [{
        type: String,
        // Enum of available modules/actions
        enum: [
            'MODULE_DASHBOARD',
            'MODULE_BOOKINGS',
            'MODULE_EXPENSES',
            'MODULE_FINANCE',
            'MODULE_SETTINGS',
            'ACTION_MANAGE_USERS', // Admin specific
            'ACTION_MANAGE_ROLES'  // Admin specific
        ]
    }],
    isSystem: {
        type: Boolean,
        default: false // System roles (like Super Admin) cannot be deleted
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
