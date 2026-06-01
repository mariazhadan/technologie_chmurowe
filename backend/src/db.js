const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
