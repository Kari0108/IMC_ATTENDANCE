module.exports = (sequelize, DataTypes) => {
  const LocationAlert = sequelize.define('LocationAlert', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'users',
        key: 'phone_number'
      }
    },
    alert_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    original_latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    original_longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    current_latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    current_longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    distance: {
      type: DataTypes.DOUBLE, // Distance of deviation in meters
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING, // e.g., "Worker deviated from assigned zone"
      defaultValue: "Worker deviated from assigned zone during active period",
      allowNull: true
    }
  }, {
    tableName: 'location_alerts',
    timestamps: true
  });
  return LocationAlert;
};
