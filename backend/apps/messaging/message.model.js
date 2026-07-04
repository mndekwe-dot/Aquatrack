const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sender_type: { type: DataTypes.ENUM('staff', 'household'), allowNull: false },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  receiver_type: { type: DataTypes.ENUM('staff', 'household'), allowNull: false },
  receiver_id: { type: DataTypes.INTEGER, allowNull: false },
  subject: { type: DataTypes.STRING },
  body: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Message;
