const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  age: { type: Number },
  total_outstanding_debt: { type: Number, default: 0 },
  risk_category: { type: String, enum: ['Low', 'Medium', 'High', 'Unknown'], default: 'Unknown' },
  delay_velocity: { type: Number, default: 0 } // mock metric for ML
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
