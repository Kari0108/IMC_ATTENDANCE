const express = require('express');
const db = require('../config/db');

module.exports = (upload) => {
  const router = express.Router();

  router.post('/mark-attendance', upload.single('selfie'), async (req, res) => {
    const { phone_number, latitude, longitude } = req.body;
    const selfie = req.file?.filename;

    try {
      const [user] = await db.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
      if (!user.length) return res.status(404).json({ message: 'User not found' });

      await db.query(`
        INSERT INTO attendance (user_id, attendance_time, location, latitude, longitude, selfie)
        VALUES (?, NOW(), ?, ?, ?, ?)`,
        [user[0].id, 'Auto-Location', latitude, longitude, selfie]
      );

      res.json({ message: 'Attendance marked successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
};
