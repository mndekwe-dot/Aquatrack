const { Sequelize } = require('sequelize');

// Tests run against a dedicated database on the same Postgres server, so
// `sequelize.sync({ force: true })` in the test suite can never touch real data.
const dbName = process.env.NODE_ENV === 'test'
  ? (process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test`)
  : process.env.DB_NAME;

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

module.exports = sequelize;
