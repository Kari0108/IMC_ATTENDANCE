module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'users', // This is the table name for the User model
        key: 'phone_number'
      }
    },
    name: {
      type: DataTypes.STRING, // Denormalized for easier querying
      allowNull: false
    },
    attendance_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    accuracy: {
      type: DataTypes.DOUBLE, // Accuracy of GPS reading in meters
      allowNull: true // Can be optional
    },
    location_name: {
      type: DataTypes.STRING, // Reverse geocoded address
      allowNull: true
    },
    selfie: {
      type: DataTypes.STRING, // Path to the uploaded selfie file
      allowNull: false
      // Example: /uploads/attendance_9876543210_1678888888888.jpg
    }
  }, {
    tableName: 'attendances',
    timestamps: true
  });
  return Attendance;
};