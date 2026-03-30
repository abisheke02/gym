/**
 * Database adapter — connects to PostgreSQL (or Supabase via connection string)
 * Drop-in replacement for the pg Pool interface: exposes query(text, params).
 */
const { Pool } = require('pg');
const config = require('../config');

// Always use the Supabase/PostgreSQL connection string
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for external Supabase connection
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
