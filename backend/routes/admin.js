const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/admin/view-attendance', (req, res) => {
  const { search, type } = req.query;
  let query = `
    SELECT a.*, u.name, u.phone_number
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE DATE(a.attendance_time) = CURDATE()
  `;

  const params = [];

  if (search && type) {
    if (type === 'name') {
      query += ` AND u.name LIKE ?`;
      params.push(`%${search}%`);
    } else if (type === 'phone') {
      query += ` AND u.phone_number LIKE ?`;
      params.push(`%${search}%`);
    }
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching attendance' });
    res.json(results);
  });
});

module.exports = router;
