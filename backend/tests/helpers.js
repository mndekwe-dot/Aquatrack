const sequelize = require('../config/database');
const app = require('../server');

async function resetDB() {
  await sequelize.sync({ force: true });
}

module.exports = { app, sequelize, resetDB };
