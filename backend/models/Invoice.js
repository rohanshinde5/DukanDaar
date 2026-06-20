const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
      },

      productName: String,

      quantity: Number,

      unitPrice: Number,

      subtotal: Number
    }
  ],

  totalAmount: Number,

  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Paid'
  }

}, { timestamps: true });

module.exports = mongoose.model(
  'Invoice',
  invoiceSchema
);