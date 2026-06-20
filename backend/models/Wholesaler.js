const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  purchase_date: { type: Date, default: Date.now },
  due_date: { 
    type: Date, 
    default: function() {
      const baseDate = this.purchase_date || new Date();
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + 3);
      return d;
    }
  },
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' }
});

const wholesalerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  upcoming_dues: { type: Number, default: 0 },
  due_date: { type: Date },
  purchases: [purchaseSchema]
}, { timestamps: true });

wholesalerSchema.pre('save', function() {
  // Calculate upcoming_dues from Unpaid purchases
  this.upcoming_dues = this.purchases
    .filter(p => p.status === 'Unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Set due_date to the earliest unpaid purchase due_date
  const unpaidPurchases = this.purchases.filter(p => p.status === 'Unpaid');
  if (unpaidPurchases.length > 0) {
    const dates = unpaidPurchases.map(p => new Date(p.due_date));
    this.due_date = new Date(Math.min(...dates));
  } else {
    this.due_date = null;
  }
});

module.exports = mongoose.model('Wholesaler', wholesalerSchema);
