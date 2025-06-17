const db = require('../config/db');

exports.findUserByPhone = (phone, callback) => {
  db.query('SELECT * FROM users WHERE phone_number = ?', [phone], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.getUserLastLocation = (userId, callback) => {
  const sql = `
    SELECT latitude, longitude
    FROM attendance
    WHERE user_id = ?
    ORDER BY attendance_time DESC
    LIMIT 1
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.markAttendance = (userId, location, lat, lng, selfieFilename, callback) => {
  const checkSql = `SELECT * FROM attendance WHERE user_id = ? AND DATE(attendance_time) = CURDATE()`;
  db.query(checkSql, [userId], (err, rows) => {
    if (err) return callback(err);
    if (rows.length > 0) return callback(null, { alreadyMarked: true });

    const insertSql = `
      INSERT INTO attendance (user_id, attendance_time, location, latitude, longitude, selfie)
      VALUES (?, NOW(), ?, ?, ?, ?)
    `;
    db.query(insertSql, [userId, location, lat, lng, selfieFilename], (err) => {
      if (err) return callback(err);
      callback(null, { success: true });
    });
  });
};

exports.updateLocation = (userId, lat, lng, callback) => {
  const sql = `
    INSERT INTO attendance (user_id, attendance_time, location, latitude, longitude)
    VALUES (?, NOW(), ?, ?, ?)
  `;
  db.query(sql, [userId, `${lat},${lng}`, lat, lng], callback);
};

exports.getTodayAttendance = (callback) => {
  const sql = `
    SELECT u.name, u.phone_number, a.attendance_time, a.location, a.selfie
    FROM attendance a
    JOIN users u ON u.id = a.user_id
    WHERE DATE(a.attendance_time) = CURDATE()
    ORDER BY a.attendance_time DESC
  `;
  db.query(sql, callback);
};
