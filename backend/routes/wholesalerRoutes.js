const express = require('express');
const router = express.Router();
const Wholesaler = require('../models/Wholesaler');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const wholesalers = await Wholesaler.find();
    res.json(wholesalers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
