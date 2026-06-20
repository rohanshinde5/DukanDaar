const express = require('express');

const router = express.Router();

const {
  checkout
} = require('../controllers/checkoutController');

const {
  protect
} = require('../middleware/authMiddleware');

router.post('/', protect, checkout);

module.exports = router;