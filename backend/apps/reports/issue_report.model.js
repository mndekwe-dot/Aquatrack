const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const IssueReport = sequelize.define('IssueReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  household_id: { type: DataTypes.INTEGER, allowNull: false },
  sector: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: false },
  issue_type: { type: DataTypes.ENUM('leak', 'no_water', 'low_pressure', 'other'), allowNull: false },
  duration: { type: DataTypes.STRING }, // "How long?" dropdown from the wireframe (e.g. "Today", "2-3 days", "Over a week")
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved'), defaultValue: 'open' },
  assigned_to: { type: DataTypes.INTEGER, allowNull: true }, // staff id
});

module.exports = IssueReport;
