require('dotenv').config();
const Household = require('./apps/households/household.model');
const sequelize = require('./config/database');

sequelize.sync().then(async () => {
  await Household.create({
    owner_name: 'Test Citizen',
    owner_email: 'citizen@aquatrack.rw',
    password: 'citizen123',
    address: 'KG 123 St, Kigali',
    zone: 'Gasabo',
    status: 'active',
  });
  console.log('✓ Citizen created — email: citizen@aquatrack.rw | password: citizen123');
  process.exit();
}).catch(err => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
