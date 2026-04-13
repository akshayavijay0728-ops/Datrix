const express = require('express');
const router  = express.Router();

// ── City tier classification ──────────────────────────────────────────────────
const METRO_CITIES = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune'];
const TIER2_CITIES = ['ahmedabad', 'jaipur', 'kochi', 'surat', 'lucknow', 'nagpur', 'indore', 'bhopal', 'visakhapatnam'];

function getCityTier(city = '') {
  const c = city.toLowerCase().trim();
  if (METRO_CITIES.includes(c)) return 'metro';
  if (TIER2_CITIES.includes(c)) return 'tier2';
  return 'tier3';
}

// ── Earnings estimate ranges (₹/month) by tier ───────────────────────────────
const EARNINGS_MAP = {
  metro: { min: 1200, max: 2800 },
  tier2: { min:  700, max: 1500 },
  tier3: { min:  400, max:  900 },
};

// ── Goal → personalised suggestions ──────────────────────────────────────────
function getSuggestions(goal = '', cityTier) {
  const g = goal.toLowerCase();

  const tierBoost = cityTier === 'metro'
    ? 'Living in a metro means more partner merchants near you — swipe your linked card at any of 500+ partner stores for instant cashback.'
    : cityTier === 'tier2'
    ? 'Many Tier-2 city merchants now partner with Datrix — check the in-app map to find the closest cashback store near you.'
    : 'Even in smaller cities, online spending earns the same cashback. Shop via the Datrix browser extension to never miss a reward.';

  if (g.includes('cashback') || g.includes('purchases')) {
    return [
      'Link your UPI ID (GPay / PhonePe / Paytm) to automatically track every transaction and earn 5% cashback without any extra steps.',
      'Turn on "Smart Basket" in the app — it detects your favourite shopping categories (groceries, fashion, electronics) and unlocks bonus multipliers.',
      tierBoost,
    ];
  }

  if (g.includes('bills') || g.includes('finances') || g.includes('save')) {
    return [
      'Connect your electricity, gas, and broadband bills through Datrix Bill Manager — we compare providers and switch you to cheaper plans automatically.',
      'Enable "Subscription Audit" to see all your recurring payments in one place. Most users find ₹300–700/month in unused subscriptions they cancel instantly.',
      tierBoost,
    ];
  }

  if (g.includes('data')) {
    return [
      'Complete your Data Profile (takes 3 minutes) — brands pay higher rewards for detailed, verified profiles. Fill yours to unlock Premium Data Tier.',
      'Turn on "Passive Data Sharing" for anonymised shopping insights. You stay 100% in control and earn ₹15–40 per brand survey automatically.',
      tierBoost,
    ];
  }

  // "All of the above" or unknown goal — give a general power-user roadmap
  return [
    'Link your UPI and 2–3 most-used apps (Amazon, Swiggy, Blinkit) in Settings → Connected Apps to start earning cashback on every purchase automatically.',
    'Complete your profile and turn on Passive Data Sharing to stack data rewards on top of cashback — double-dipping is 100% allowed on Datrix!',
    tierBoost,
  ];
}

// ─── POST /api/insights ───────────────────────────────────────────────────────
// Body: { firstName, city, goal }
router.post('/', (req, res) => {
  try {
    const { firstName, city, goal } = req.body;

    if (!firstName || !city || !goal) {
      return res.status(400).json({ success: false, message: 'firstName, city, and goal are required.' });
    }

    const cityTier   = getCityTier(city);
    const earnings   = EARNINGS_MAP[cityTier];
    const suggestions = getSuggestions(goal, cityTier);

    const welcome = `Welcome to Datrix, ${firstName.trim()}! 🎉 We're thrilled to have you join from ${city}. `
      + `You're part of a fast-growing community of Indians who are putting their everyday spending and data to work. `
      + `Based on users in ${city} with a similar goal, here's what your first month could look like.`;

    return res.json({
      success: true,
      insight: {
        welcome,
        city,
        cityTier,
        estimatedEarnings: {
          min:      earnings.min,
          max:      earnings.max,
          currency: 'INR',
          period:   'monthly',
          label:    `₹${earnings.min}–₹${earnings.max} per month`,
        },
        suggestions,
        goal,
        cashbackRate: '5% on every transaction',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Insights error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
