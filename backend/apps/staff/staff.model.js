const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const Staff = sequelize.define('Staff', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'meter_reader', 'technician', 'billing'), defaultValue: 'meter_reader' },
  phone: { type: DataTypes.BIGINT },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

Staff.beforeCreate(async (staff) => {
  staff.password = await bcrypt.hash(staff.password, 10);
});

Staff.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Staff;
