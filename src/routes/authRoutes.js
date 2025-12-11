const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateMe, getAllUsers, createUser, updateUserDetails, updateUserPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/permissionMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe); // Update Profile (Language etc)

// Admin User Management
router.route('/users')
    .get(protect, protectAdmin, getAllUsers)
    .post(protect, protectAdmin, createUser);

router.route('/users/:id')
    .put(protect, protectAdmin, updateUserDetails);

router.route('/users/:id/password')
    .put(protect, protectAdmin, updateUserPassword);

module.exports = router;
