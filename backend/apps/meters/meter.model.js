const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Meter = sequelize.define('Meter', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  serial_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  household_id: { type: DataTypes.INTEGER, allowNull: false },
  installation_date: { type: DataTypes.DATEONLY },
  last_reading: { type: DataTypes.FLOAT, defaultValue: 0 },
  last_reading_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('active', 'faulty', 'replaced'), defaultValue: 'active' },
});

module.exports = Meter;
