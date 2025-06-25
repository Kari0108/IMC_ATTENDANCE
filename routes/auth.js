// routes/auth.js
const express = require('express');
const { sequelize } = require('../config/db');
const User = require('../models/User')(sequelize, require('sequelize').DataTypes);
const router = express.Router();

// @desc    Authenticate user (worker login)
// @route   POST /api/login
// @access  Public
router.post('/login', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    const user = await User.findOne({ where: { phone_number: phoneNumber } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please check your phone number.' });
    }

    // In a real app, you might have a password or OTP here.
    // For this use case, presence of phone number in DB is sufficient for "login"
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        phone_number: user.phone_number,
        name: user.name,
        assigned_latitude: user.assigned_latitude,
        assigned_longitude: user.assigned_longitude,
        assigned_zone_radius: user.assigned_zone_radius
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

module.exports = router;