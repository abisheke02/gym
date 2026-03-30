const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gym_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixConstraint() {
  try {
    console.log('Fixing users_role_check constraint...');
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'manager', 'sales', 'accountant', 'receptionist'));
    `);
    console.log('✅ Constraint updated successfully');
    await pool.end();
  } catch (error) {
    console.error('❌ Error updating constraint:', error);
    process.exit(1);
  }
}

fixConstraint();
