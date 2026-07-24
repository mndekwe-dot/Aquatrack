require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const Staff = require('./apps/staff/staff.model');

async function seed() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        const email = 'admin@wasac.rw';
        const password = 'Admin@2026';
        const name = 'WASAC Admin';

        const existing = await Staff.findOne({ where: { email } });
        if (existing) {
            console.log('Admin account already exists:', email);
            process.exit(0);
        }

        // bcrypt hash is done automatically by the beforeCreate hook in Staff model
        const staff = await Staff.create({
            name,
            email,
            password,
            role: 'admin',
            active: true,
        });

        console.log('✅ Admin staff account created successfully!');
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   Role: admin');
        console.log('');
        console.log('⚠️  Please change this password immediately after first login.');
        process.exit(0);

    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    }
}

seed();