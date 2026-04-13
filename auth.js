const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Body: { firstName, lastName, email, phone, city, goal, password? }
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, goal, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !city || !goal) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    // Prevent duplicate accounts
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Use a default password if none supplied (e.g. social sign-up flow)
    const rawPassword = password || 'Datrix@Default123';

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || '',
      city,
      goal,
      password: rawPassword,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome to Datrix, ${firstName}! Your account is ready.`,
      user: {
        id:           user._id,
        firstName:    user.firstName,
        lastName:     user.lastName,
        email:        user.email,
        phone:        user.phone,
        city:         user.city,
        goal:         user.goal,
        totalRewards: user.totalRewards,
        createdAt:    user.createdAt,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
