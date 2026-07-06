const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const MeterReading = sequelize.define('MeterReading', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  meter_id: { type: DataTypes.INTEGER, allowNull: false },
  household_id: { type: DataTypes.INTEGER, allowNull: false },
  reading_value: { type: DataTypes.FLOAT, allowNull: false },
  consumption_delta: { type: DataTypes.FLOAT },
  reading_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  recorded_by: { type: DataTypes.INTEGER },
});

module.exports = MeterReading;
