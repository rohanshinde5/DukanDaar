const express = require('express');
const router = express.Router();
const {
  getWholesalers,
  getWholesalerById,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
  addPurchase,
  updatePurchase,
  deletePurchase
} = require('../controllers/wholesalerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getWholesalers)
  .post(protect, createWholesaler);

router.route('/:id')
  .get(protect, getWholesalerById)
  .put(protect, updateWholesaler)
  .delete(protect, deleteWholesaler);

router.route('/:id/purchases')
  .post(protect, addPurchase);

router.route('/:id/purchases/:purchaseId')
  .put(protect, updatePurchase)
  .delete(protect, deletePurchase);

module.exports = router;
