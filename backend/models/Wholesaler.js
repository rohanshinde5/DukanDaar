const mongoose = require('mongoose');

const wholesalerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  upcoming_dues: { type: Number, default: 0 },
  due_date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Wholesaler', wholesalerSchema);
