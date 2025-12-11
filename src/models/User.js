const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    surname: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        enum: ['en', 'hi', 'gu', 'mr'],
        default: 'en'
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    mobile: {
        type: String,
        default: ''
    },
    profilePic: {
        type: String, // URL to image or base64
        default: ''
    },
    passwordHash: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

module.exports = mongoose.model('User', userSchema);
