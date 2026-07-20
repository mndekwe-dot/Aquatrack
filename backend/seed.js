require('dotenv').config();
const Staff = require('./apps/staff/staff.model');
const sequelize = require('./config/database');

sequelize.sync().then(async () => {
  await Staff.create({
    name: 'Admin',
    email: 'admin@aquatrack.rw',
    password: 'admin123',
    role: 'admin',
  });
  console.log('✓ Admin created — email: admin@aquatrack.rw | password: admin123');
  process.exit();
}).catch(err => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
