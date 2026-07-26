// Runs before any test file or app code is loaded — must set NODE_ENV first so
// config/database.js picks the isolated test database (see config/database.js).
process.env.NODE_ENV = 'test';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'aquatrack';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'aquatrack_test';
