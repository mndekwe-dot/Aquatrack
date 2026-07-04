const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  household_id: { type: DataTypes.INTEGER },
  meter_id: { type: DataTypes.INTEGER },
  period_start: { type: DataTypes.DATEONLY, allowNull: false },
  period_end: { type: DataTypes.DATEONLY, allowNull: false },
  consumption: { type: DataTypes.FLOAT, allowNull: false },
  amount_due: { type: DataTypes.FLOAT },
  paid: { type: DataTypes.BOOLEAN, defaultValue: false },
  paid_at: { type: DataTypes.DATE },
  generated_by: { type: DataTypes.INTEGER },
});

module.exports = Report;
