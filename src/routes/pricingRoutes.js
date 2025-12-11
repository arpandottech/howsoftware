const express = require('express');
const router = express.Router();
const { getPricingSettings, updatePricingSettings } = require('../controllers/pricingController');
const { protect } = require('../middleware/auth');

router.get('/settings', getPricingSettings);
router.put('/settings', protect, updatePricingSettings);

module.exports = router;
