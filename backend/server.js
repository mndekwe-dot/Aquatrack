require('dotenv').config();

console.log("DB_PORT =", process.env.DB_PORT);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/database');
const path = require("path");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use('/api/staff', require('./apps/staff/staff.routes'));
app.use('/api/households', require('./apps/households/household.routes'));
app.use('/api/meters', require('./apps/meters/meter.routes'));
app.use('/api/alerts', require('./apps/alerts/alert.routes'));
app.use('/api/reports', require('./apps/reports/report.routes'));
app.use('/api/notifications', require('./apps/notifications/notification.routes'));
app.use('/api/messages', require('./apps/messaging/message.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to connect to database:', err.message);
});
