const express = require('express');
const { Op } = require('sequelize'); // Import Op for operators like LIKE
const { sequelize } = require('../config/db');
const Attendance = require('../models/Attendance')(sequelize, require('sequelize').DataTypes);
const router = express.Router();

// @desc    View attendance data for admin panel
// @route   GET /api/admin/view-attendance
// @access  Public (should be protected in a real app)
router.get('/view-attendance', async (req, res) => {
  const { search, type } = req.query; // type can be 'name' or 'phone'

  try {
    let whereClause = {};

    // Filter by today's date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    whereClause.attendance_time = {
      [Op.between]: [startOfToday, endOfToday]
    };

    if (search && type) {
      if (type === 'name') {
        whereClause.name = {
          [Op.like]: `%${search}%` // Case-insensitive search
        };
      } else if (type === 'phone') {
        whereClause.phone_number = {
          [Op.like]: `%${search}%` // Search by phone number
        };
      }
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      order: [['attendance_time', 'DESC']] // Order by most recent first
    });

    res.status(200).json(attendanceRecords);

  } catch (error) {
    console.error('Error fetching attendance data:', error);
    res.status(500).json({ message: 'Server error fetching attendance data.' });
  }
});

module.exports = router;