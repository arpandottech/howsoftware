const express = require('express');
const { getExpenses, createExpense, deleteExpense } = require('../controllers/expenseController');
const router = express.Router();
// const { protect } = require('../middleware/authMiddleware'); // Uncomment if auth is ready

// router.use(protect); // Apply protection if needed

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.route('/:id')
    .delete(deleteExpense);

module.exports = router;
