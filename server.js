// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db'); // Correctly import connectDB

// Load environment variables
dotenv.config();

const app = express();

// Connect to database (call the async function)
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON data
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// Serve static files (for selfies from 'uploads' directory)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files (e.g., indore.jpg, if they are in the root of your project)
// This will serve files like indore.jpg directly from http://localhost:3000/indore.jpg
app.use(express.static(path.join(__dirname, '/'))); // <--- ADDED THIS LINE

// Serve your frontend HTML files directly if they are in the root directory
app.get('/user.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Import Routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

// Use Routes
app.use('/api', authRoutes);
app.use('/api', attendanceRoutes);
app.use('/api/admin', adminRoutes);

// Basic route for root
app.get('/', (req, res) => {
  res.send('Welcome to IMC Attendance Backend API');
});

// Error handling middleware (optional but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
