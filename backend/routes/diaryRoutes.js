const express = require('express');
const router = express.Router();
const { getEntries, createEntry, updateEntry, deleteEntry } = require('../controllers/diaryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getEntries);
router.post('/', protect, createEntry);
router.put('/:id', protect, updateEntry);
router.delete('/:id', protect, deleteEntry);

module.exports = router;
