// routes/attendance.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs module for file operations
const { sequelize } = require('../config/db'); // Assuming db.js exports sequelize
const Attendance = require('../models/Attendance')(sequelize, require('sequelize').DataTypes);
const LocationAlert = require('../models/LocationAlert')(sequelize, require('sequelize').DataTypes);
const User = require('../models/User')(sequelize, require('sequelize').DataTypes);
const router = express.Router();

// Helper function to calculate distance between two lat/lon points (Haversine formula)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of Earth in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Distance in meters
}

// Function to perform reverse geocoding
async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
    const data = await response.json();
    if (data && data.display_name) {
      // Return a concise address, e.g., first few comma-separated parts
      return data.display_name.split(',').slice(0, 3).join(', ');
    }
    return `(${lat.toFixed(6)}, ${lon.toFixed(6)})`; // Fallback to coordinates
  } catch (error) {
    console.error('Backend reverse geocoding error:', error);
    return `(${lat.toFixed(6)}, ${lon.toFixed(6)})`; // Fallback on error
  }
}

// Ensure the 'uploads' directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Store files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: attendance_phoneNumber_timestamp.jpg
    const timestamp = Date.now();
    const phoneNumber = req.body.phone_number; // Get phone number from form data
    const filename = `attendance_${phoneNumber}_${timestamp}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Only allow JPEG/JPG/PNG images
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG) are allowed!'));
    }
  }
});

// @desc    Mark attendance
// @route   POST /api/mark-attendance
// @access  Public
router.post('/mark-attendance', upload.single('selfie'), async (req, res) => {
  const { phone_number, latitude, longitude, accuracy } = req.body;

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Selfie image is required.' });
  }

  // Ensure required data is present
  if (!phone_number || !latitude || !longitude) {
    // If missing data, delete the uploaded file before returning
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file after missing data:', err);
    });
    return res.status(400).json({ success: false, message: 'Missing required attendance data.' });
  }

  try {
    const user = await User.findOne({ where: { phone_number } });
    if (!user) {
      // If user not found, delete the uploaded selfie as it's invalid
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({ success: false, message: 'User not found for attendance marking.' });
    }

    // Convert latitude and longitude to numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const acc = accuracy ? parseFloat(accuracy) : null;

    // Location validation (within 100m of assigned zone)
    let isLocationValid = true;
    if (user.assigned_latitude && user.assigned_longitude && user.assigned_zone_radius) {
      const distance = getDistanceInMeters(user.assigned_latitude, user.assigned_longitude, lat, lon);
      console.log(`Distance from assigned zone for ${phone_number}: ${distance.toFixed(2)}m`);
      if (distance > user.assigned_zone_radius) { // Check if outside the 100m radius
        isLocationValid = false;
        // As per user flow, if location is not valid, attendance is NOT marked.
        if (req.file && req.file.path) {
          fs.unlink(req.file.path, (err) => { // Delete the uploaded file if location is invalid
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(400).json({ success: false, message: `आप अपने निर्धारित कार्यक्षेत्र से ${distance.toFixed(0)} मीटर दूर हैं। उपस्थिति दर्ज नहीं की जा सकती।` });
      }
    } else {
        // If no assigned location for user, just proceed (or enforce a default)
        console.log(`User ${phone_number} has no assigned zone. Skipping location validation.`);
    }

    // Perform reverse geocoding to get location_name
    const locationName = await reverseGeocode(lat, lon);
    console.log(`Reverse geocoded location for ${phone_number}: ${locationName}`);


    // Create attendance record
    const attendance = await Attendance.create({
      phone_number,
      name: user.name, // Use the name from the found user
      attendance_time: new Date(), // Explicitly set current time
      latitude: lat,
      longitude: lon,
      accuracy: acc,
      location_name: locationName, // Save the geocoded location name
      selfie: req.file.filename // Store only the filename, frontend will prepend /uploads/
    });

    res.status(201).json({
      success: true,
      message: 'उपस्थिति सफलतापूर्वक दर्ज हो गई',
      attendance
    });

  } catch (error) {
    console.error('Error marking attendance:', error);
    // If an error occurred, attempt to delete the uploaded file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file after attendance marking failure:', err);
      });
    }
    res.status(500).json({ success: false, message: 'उपस्थिति दर्ज करने में त्रुटि हुई।' });
  }
});

// @desc    Log location alert (worker leaves zone)
// @route   POST /api/location-alert
// @access  Public
router.post('/location-alert', async (req, res) => {
  const { phone_number, original_lat, original_lon, current_lat, current_lon, distance } = req.body;

  if (!phone_number || !original_lat || !original_lon || !current_lat || !current_lon || !distance) {
    return res.status(400).json({ success: false, message: 'Missing required alert data.' });
  }

  try {
    const alert = await LocationAlert.create({
      phone_number,
      alert_time: new Date(), // Explicitly set current time
      original_latitude: original_lat,
      original_longitude: original_lon,
      current_latitude: current_lat,
      current_longitude: current_lon,
      distance: parseFloat(distance),
      reason: "Worker deviated from assigned zone during active period"
    });

    console.log(`Location alert logged for ${phone_number}: ${distance}m deviation.`);
    res.status(201).json({ success: true, message: 'Location alert logged.', alert });

  } catch (error) {
    console.error('Error logging location alert:', error);
    res.status(500).json({ success: false, message: 'Error logging location alert.' });
  }
});

module.exports = router;
