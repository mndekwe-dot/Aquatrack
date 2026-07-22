const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const Household = sequelize.define('Household', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  //  login fields (citizen account)
  full_name: { type: DataTypes.STRING, allowNull: false },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: { type: DataTypes.STRING, allowNull: true },
  password: { type: DataTypes.STRING, allowNull: false },

  // Location fields
  district: { type: DataTypes.STRING, allowNull: false },
  sector: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING },

  // Meter link
  meter_id: { type: DataTypes.STRING, allowNull: false, unique: true },

  status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },

  // SMS alert preferences
  sms_low_balance: { type: DataTypes.BOOLEAN, defaultValue: true },
  sms_leak_detection: { type: DataTypes.BOOLEAN, defaultValue: true },
  sms_monthly_bill: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Hash password whenever it's set or changed
Household.beforeCreate(async (household) => {
  household.password = await bcrypt.hash(household.password, 10);
});

Household.beforeUpdate(async (household) => {
  if (household.changed('password')) {
    household.password = await bcrypt.hash(household.password, 10);
  }
});

Household.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Household;
