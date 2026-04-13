const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Transaction = require('../models/Transaction');

// ─── GET /api/rewards?userId=<id> ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId query parameter is required.' });
    }

    const user = await User.findById(userId).select('firstName lastName totalRewards city goal');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Break down cashback by category for a richer response
    const breakdown = await Transaction.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id:           '$category',
          totalSpent:    { $sum: '$amount' },
          totalCashback: { $sum: '$cashback' },
          count:         { $sum: 1 },
        },
      },
      { $sort: { totalCashback: -1 } },
    ]);

    return res.json({
      success: true,
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        city:      user.city,
        goal:      user.goal,
      },
      totalRewards: user.totalRewards,
      cashbackRate: '5%',
      breakdown,
    });
  } catch (err) {
    console.error('Rewards error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
