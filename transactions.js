const express     = require('express');
const router      = express.Router();
const Transaction = require('../models/Transaction');
const User        = require('../models/User');

// ─── POST /api/transactions/add ───────────────────────────────────────────────
// Body: { userId, amount, category, date? }
router.post('/add', async (req, res) => {
  try {
    const { userId, amount, category, date } = req.body;

    if (!userId || !amount || !category) {
      return res.status(400).json({ success: false, message: 'userId, amount, and category are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const transaction = await Transaction.create({
      user:     userId,
      amount:   Number(amount),
      category: category.trim(),
      date:     date ? new Date(date) : new Date(),
    });

    // Add the 5% cashback to the user's running total
    user.totalRewards = parseFloat((user.totalRewards + transaction.cashback).toFixed(2));
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: `Transaction added! You earned ₹${transaction.cashback} cashback.`,
      transaction: {
        id:       transaction._id,
        amount:   transaction.amount,
        category: transaction.category,
        date:     transaction.date,
        cashback: transaction.cashback,
      },
      totalRewards: user.totalRewards,
    });
  } catch (err) {
    console.error('Add transaction error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/transactions?userId=<id> ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId query parameter is required.' });
    }

    const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });

    const totalSpent    = transactions.reduce((sum, t) => sum + t.amount,   0);
    const totalCashback = transactions.reduce((sum, t) => sum + t.cashback, 0);

    return res.json({
      success: true,
      count:        transactions.length,
      totalSpent:   parseFloat(totalSpent.toFixed(2)),
      totalCashback: parseFloat(totalCashback.toFixed(2)),
      transactions,
    });
  } catch (err) {
    console.error('Get transactions error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
