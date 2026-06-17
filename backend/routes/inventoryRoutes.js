const express = require('express');
const router = express.Router();
const { getInventory, addInventoryItem } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.post('/', protect, addInventoryItem);

module.exports = router;
