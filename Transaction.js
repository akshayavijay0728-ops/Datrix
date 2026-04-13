const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount:   { type: Number, required: true, min: 1 },       // in ₹
    category: { type: String, required: true, trim: true },   // e.g. "Groceries"
    date:     { type: Date,   default: Date.now },
    cashback: { type: Number, default: 0 },                   // 5% of amount
  },
  { timestamps: true }
);

// Auto-compute 5% cashback before saving
transactionSchema.pre('save', function (next) {
  this.cashback = parseFloat((this.amount * 0.05).toFixed(2));
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
