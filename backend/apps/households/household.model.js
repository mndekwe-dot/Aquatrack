const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const Household = sequelize.define('Household', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  address: { type: DataTypes.STRING, allowNull: false },
  owner_name: { type: DataTypes.STRING, allowNull: false },
  owner_phone: { type: DataTypes.BIGINT },
  owner_email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  zone: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
});

Household.beforeCreate(async (household) => {
  household.password = await bcrypt.hash(household.password, 10);
});

Household.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Household;
