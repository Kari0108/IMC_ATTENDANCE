// config/db.js
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Set to true to see SQL queries in console
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connection has been established successfully.');

    // Import models after sequelize is initialized
    // Ensure the paths are correct based on your project structure
    const User = require('../models/User')(sequelize, DataTypes);
    const Attendance = require('../models/Attendance')(sequelize, DataTypes);
    const LocationAlert = require('../models/LocationAlert')(sequelize, DataTypes);

    // Define associations (if any, e.g., Attendance belongsTo User)
    Attendance.belongsTo(User, { foreignKey: 'phone_number', targetKey: 'phone_number' });
    LocationAlert.belongsTo(User, { foreignKey: 'phone_number', targetKey: 'phone_number' });

    // Sync all models with the database
    // { force: true } will drop existing tables and recreate them (USE WITH CAUTION IN PRODUCTION)
    // { alter: true } will try to make necessary changes to the database to match the model
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');

    // Seed initial users if none exist
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Seeding initial users...');
      await User.bulkCreate([
        {
          phone_number: '9876543210',
          name: 'अमन कुमार',
          assigned_latitude: 22.7196, // Example assigned location (Indore, MP)
          assigned_longitude: 75.8577,
          assigned_zone_radius: 100 // 100 meters
        },
        {
          phone_number: '9988776655',
          name: 'भावना शर्मा',
          assigned_latitude: 22.7200, // Slightly different location
          assigned_longitude: 75.8580,
          assigned_zone_radius: 100
        },
        {
          phone_number: '9123456789',
          name: 'सुरेश यादव',
          assigned_latitude: 22.7180,
          assigned_longitude: 75.8590,
          assigned_zone_radius: 100
        },
        {
            phone_number: '9800000000', // User added in a previous step
            name: 'नया उपयोगकर्ता',
            assigned_latitude: 22.722835,
            assigned_longitude: 75.85978,
            assigned_zone_radius: 100
        }
      ]);
      console.log('Initial users seeded successfully.');
    } else {
      console.log(`Found ${userCount} existing users.`);
    }

  } catch (error) {
    console.error('Unable to connect to the database or sync models:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = { sequelize, connectDB };
