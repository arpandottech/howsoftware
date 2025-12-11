const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/pricingSettingsController');
// const { protect } = require('../middleware/authMiddleware'); // Add protect if needed

router.route('/')
    .get(getSettings)
    .put(updateSettings);

module.exports = router;
