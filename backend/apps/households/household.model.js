const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Household = sequelize.define('Household', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  address: { type: DataTypes.STRING, allowNull: false },
  owner_name: { type: DataTypes.STRING, allowNull: false },
  owner_phone: { type: DataTypes.BIGINT },
  owner_email: { type: DataTypes.STRING },
  zone: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
});

module.exports = Household;
