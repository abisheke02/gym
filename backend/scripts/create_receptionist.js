const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'gym_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function createReceptionist() {
  try {
    const passwordHash = await bcrypt.hash('reception123', 12);
    
    // Get a branch ID
    const branchRes = await pool.query('SELECT id FROM branches LIMIT 1');
    const branchId = branchRes.rows[0]?.id;

    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role, branch_id)
      VALUES ('reception@ironmanfitness.com', $1, 'Gym Receptionist', '9876543210', 'receptionist', $2)
      ON CONFLICT (email) DO UPDATE SET role = 'receptionist', branch_id = $2
    `, [passwordHash, branchId]);

    console.log('✅ Receptionist user created/updated:');
    console.log('Email: reception@ironmanfitness.com');
    console.log('Password: reception123');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating receptionist:', error);
    process.exit(1);
  }
}

createReceptionist();
