const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

router.post('/login', (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) return res.status(400).json({ message: 'फोन नंबर आवश्यक है' });

  User.findUserByPhone(phone_number, (err, user) => {
    if (err) return res.status(500).json({ message: 'त्रुटि हुई' });
    if (!user) return res.status(404).json({ message: 'यूज़र नहीं मिला' });

    res.json({ message: 'लॉगिन सफल', user_id: user.id });
  });
});

module.exports = router;

