/**
 * Database adapter — connects to PostgreSQL (or Supabase via connection string)
 * Drop-in replacement for the pg Pool interface: exposes query(text, params).
 */
const { Pool } = require('pg');
const config = require('../config');

// Use DATABASE_URL — disable SSL for local Docker, enable for Supabase/cloud
const dbUrl = process.env.DATABASE_URL || '';
const poolConfig = {
  connectionString: dbUrl,
  ssl: dbUrl.includes('supabase') || dbUrl.includes('render') || dbUrl.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
};

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
