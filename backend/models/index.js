const Staff = require('../apps/staff/staff.model');
const Household = require('../apps/households/household.model');
const Meter = require('../apps/meters/meter.model');
const MeterReading = require('../apps/meters/meter_reading.model');
const Report = require('../apps/reports/report.model');
const Alert = require('../apps/alerts/alert.model');
const Notification = require('../apps/notifications/notification.model');
const Message = require('../apps/messaging/message.model');

Household.hasMany(Meter, { foreignKey: 'household_id', onDelete: 'RESTRICT' });
Meter.belongsTo(Household, { foreignKey: 'household_id' });

Meter.hasMany(MeterReading, { foreignKey: 'meter_id', onDelete: 'CASCADE' });
MeterReading.belongsTo(Meter, { foreignKey: 'meter_id' });

Household.hasMany(MeterReading, { foreignKey: 'household_id', onDelete: 'CASCADE' });
MeterReading.belongsTo(Household, { foreignKey: 'household_id' });

Staff.hasMany(MeterReading, { foreignKey: 'recorded_by', onDelete: 'SET NULL' });
MeterReading.belongsTo(Staff, { foreignKey: 'recorded_by', as: 'recorder' });

Household.hasMany(Report, { foreignKey: 'household_id', onDelete: 'RESTRICT' });
Report.belongsTo(Household, { foreignKey: 'household_id' });

Meter.hasMany(Report, { foreignKey: 'meter_id', onDelete: 'SET NULL' });
Report.belongsTo(Meter, { foreignKey: 'meter_id' });

Staff.hasMany(Report, { foreignKey: 'generated_by', onDelete: 'SET NULL' });
Report.belongsTo(Staff, { foreignKey: 'generated_by', as: 'generator' });

Household.hasMany(Alert, { foreignKey: 'household_id', onDelete: 'CASCADE' });
Alert.belongsTo(Household, { foreignKey: 'household_id' });

Meter.hasMany(Alert, { foreignKey: 'meter_id', onDelete: 'SET NULL' });
Alert.belongsTo(Meter, { foreignKey: 'meter_id' });

module.exports = { Staff, Household, Meter, MeterReading, Report, Alert, Notification, Message };
