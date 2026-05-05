const mysql = require('mysql2/promise');
require('dotenv').config();

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(`⚠️ Missing DB env vars: ${missingVars.join(', ')}`);
}

const useSSL = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: useSSL
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 15000),
  timezone: '+00:00',
  charset: 'utf8mb4',
});

// Test connection on startup
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('Check Railway credentials and network allowlist settings.');
      process.exit(1);
    }
  }
}
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
testConnection();

module.exports = pool;
