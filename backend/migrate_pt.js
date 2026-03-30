const { pool } = require('./src/db');

(async () => {
  try {
    console.log('🔄 Updating database for Personal Training...');

    // Create trainers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trainers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        specialization TEXT,
        salary DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        branch_id UUID REFERENCES branches(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add PT fields to members table
    // Using DO block to safely add columns if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='pt_trainer_id') THEN
          ALTER TABLE members ADD COLUMN pt_trainer_id UUID REFERENCES trainers(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='pt_joining_date') THEN
          ALTER TABLE members ADD COLUMN pt_joining_date DATE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='pt_end_date') THEN
          ALTER TABLE members ADD COLUMN pt_end_date DATE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='pt_sessions_total') THEN
          ALTER TABLE members ADD COLUMN pt_sessions_total INTEGER DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='pt_sessions_completed') THEN
          ALTER TABLE members ADD COLUMN pt_sessions_completed INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    console.log('✅ DB Update Complete: Trainers and Personal Training fields added.');
    process.exit(0);
  } catch (error) {
    console.error('❌ DB Update Failed:', error);
    process.exit(1);
  }
})();
