const express = require('express');
const router = express.Router();
const { createBooking, endSession, getTodayBookings, getAllBookings, checkIn, updateBooking, searchStudios, getStudioAnalytics } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/studios', protect, searchStudios);
router.get('/analytics/studios', protect, getStudioAnalytics);
router.post('/', protect, createBooking);
router.get('/', getAllBookings); // Removed protect for debugging
router.get('/today', protect, getTodayBookings);
router.post('/:id/check-in', protect, checkIn);
router.post('/:id/end-session', protect, endSession);
router.put('/:id', protect, updateBooking);

module.exports = router;
