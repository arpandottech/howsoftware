const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Admin only if specific requirement)
exports.registerUser = async (req, res, next) => {
    try {
        const { name, surname, email, mobile, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Pass password as passwordHash to model (pre-save hook will hash it)
        const user = await User.create({
            name,
            surname,
            email,
            mobile,
            passwordHash: password,
            role // Expecting Role ObjectId
        });

        if (user) {
            // Populate role before sending back
            await user.populate('role');

            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                role: user.role, // Populated object or ID
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ success: false, error: 'Invalid user data' });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).populate('role');

        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                mobile: user.mobile,
                profilePic: user.profilePic,
                language: user.language,
                role: user.role, // Populated
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('role');

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                profilePic: user.profilePic,
                language: user.language // Return language
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update current user details
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res, next) => {
    try {
        const fieldsToUpdate = {};
        if (req.body.name) fieldsToUpdate.name = req.body.name;
        if (req.body.surname) fieldsToUpdate.surname = req.body.surname;
        if (req.body.mobile) fieldsToUpdate.mobile = req.body.mobile;
        if (req.body.language) fieldsToUpdate.language = req.body.language;

        const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
            new: true,
            runValidators: true
        }).populate('role');

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                profilePic: user.profilePic,
                language: user.language
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Users
// @route   GET /api/users
// @access  Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).populate('role').select('-passwordHash');
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

// @desc    Create User (Admin)
// @route   POST /api/users
// @access  Admin
exports.createUser = async (req, res, next) => {
    try {
        const { name, surname, email, mobile, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const user = await User.create({
            name, surname, email, mobile, passwordHash: password, role
        });

        await user.populate('role');

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update User Details (Admin)
// @route   PUT /api/auth/users/:id
// @access  Admin
exports.updateUserDetails = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            mobile: req.body.mobile,
            role: req.body.role
        };

        const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        }).populate('role');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update User Password (Admin)
// @route   PUT /api/auth/users/:id/password
// @access  Admin
exports.updateUserPassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Set new password (pre-save hook will hash it)
        user.passwordHash = req.body.password;
        await user.save();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
