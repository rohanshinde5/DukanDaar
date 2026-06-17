const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  items: [{
    inventory_item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, required: true },
    price_at_checkout: { type: Number, required: true }
  }],
  total_cost: { type: Number, required: true },
  payment_status: { type: String, enum: ['Paid', 'Unpaid/Debt'], required: true },
  payment_method: { type: String, enum: ['Cash', 'UPI', 'Card', 'None'], default: 'None' },
  automated_timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
