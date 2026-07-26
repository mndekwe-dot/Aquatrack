const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recipient_type: { type: DataTypes.ENUM('staff', 'household'), allowNull: false },
  recipient_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('leak', 'high_usage', 'faulty_meter', 'overdue_bill', 'issue', 'system'), defaultValue: 'system' },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at: { type: DataTypes.DATE },
});

module.exports = Notification;
