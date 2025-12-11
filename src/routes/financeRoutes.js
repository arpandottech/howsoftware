const express = require('express');
const router = express.Router();
const { getFinanceStats } = require('../controllers/financeController');
// const { protect } = require('../middleware/auth'); // Uncomment if auth is needed

router.get('/', getFinanceStats);

module.exports = router;
