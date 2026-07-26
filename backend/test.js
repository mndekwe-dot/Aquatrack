require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected! Current time:', res.rows[0]);
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await pool.end();
  }
})();