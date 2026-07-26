const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Alert = sequelize.define('Alert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  household_id: { type: DataTypes.INTEGER },
  meter_id: { type: DataTypes.INTEGER },
  type: { type: DataTypes.ENUM('leak', 'high_usage', 'faulty_meter', 'overdue_bill', 'other'), allowNull: false },
  message: { type: DataTypes.TEXT },
  severity: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
  resolved_at: { type: DataTypes.DATE },
});

module.exports = Alert;
