const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getMonthlySales } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/monthly-sales', protect, getMonthlySales);
router.post('/', protect, createTransaction);
router.get('/', protect, getTransactions);

module.exports = router;
