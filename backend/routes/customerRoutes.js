const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById, addCustomer, updateCustomerDebt } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);
router.post('/', protect, addCustomer);
router.put('/:id/debt', protect, updateCustomerDebt);

module.exports = router;
