const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  cost_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  expiry_date: { type: Date, required: true },
  sales_speed: { type: Number, default: 0 } // items sold per day
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
