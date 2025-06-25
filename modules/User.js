// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    phone_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      primaryKey: true // Using phone_number as primary key
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assigned_latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true // Optional, can be null if no specific zone
    },
    assigned_longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true // Optional
    },
    assigned_zone_radius: {
      type: DataTypes.INTEGER,
      defaultValue: 100 // Default radius for attendance validation in meters
    }
  }, {
    tableName: 'users', // Optional: specify table name explicitly
    timestamps: true // Adds createdAt and updatedAt fields
  });
  return User;
};