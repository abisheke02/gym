const { Pool } = require('pg');
const config = require('../config');

const initDB = async () => {
  // First connect without database to create it if needed
  const adminPool = new Pool({
    host: config.db.host,
    port: config.db.port,
    database: 'postgres',
    user: config.db.user,
    password: config.db.password,
  });

  try {
    // Create database if not exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [config.db.database]
    );
    
    if (dbCheck.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${config.db.database}`);
      console.log(`✅ Database ${config.db.database} created`);
    }
    
    await adminPool.end();
    
    // Now connect to the gym database
    const pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
    });

    // Create tables
    await pool.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Lead Sources
      CREATE TABLE IF NOT EXISTS lead_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('meta_ads', 'website', 'manual', 'referral', 'walkin')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Plans
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        duration_months INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Users (Staff) - Create first without FK
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'sales', 'accountant', 'receptionist')),
        branch_id UUID, -- FK added later
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Branches
      CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        address TEXT,
        phone VARCHAR(20),
        manager_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Add the FK back to users if it doesn't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_branch') THEN
          ALTER TABLE users ADD CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
        END IF;
      END $$;

      -- Leads
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        gender VARCHAR(10),
        age INTEGER,
        address TEXT,
        source_id UUID REFERENCES lead_sources(id),
        branch_id UUID REFERENCES branches(id),
        assigned_to UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'trial', 'joined', 'lost')),
        whatsapp_replied BOOLEAN DEFAULT false,
        sla_start_time TIMESTAMP,
        sla_breached BOOLEAN DEFAULT false,
        follow_up_schedule TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Lead Timeline (Activity Log)
      CREATE TABLE IF NOT EXISTS lead_timeline (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT,
        performed_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Members
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        gender VARCHAR(10),
        age INTEGER,
        address TEXT,
        branch_id UUID REFERENCES branches(id),
        plan_id UUID REFERENCES plans(id),
        joining_date DATE NOT NULL,
        plan_start_date DATE NOT NULL,
        plan_end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'frozen', 'cancelled')),
        last_check_in TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- WhatsApp Messages
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID REFERENCES leads(id),
        member_id UUID REFERENCES members(id),
        direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
        message_text TEXT,
        message_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Payments
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID REFERENCES members(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'upi', 'card', 'online')),
        transaction_id VARCHAR(100),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        recorded_by UUID REFERENCES users(id),
        branch_id UUID REFERENCES branches(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Expenses
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        branch_id UUID REFERENCES branches(id),
        category VARCHAR(50) NOT NULL CHECK (category IN ('salary', 'rent', 'utilities', 'ads', 'maintenance', 'supplies', 'other')),
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        recorded_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Renewals Tracking
      CREATE TABLE IF NOT EXISTS renewal_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID REFERENCES members(id),
        reminder_type VARCHAR(20) CHECK (reminder_type IN ('7_days', '3_days', 'expiry', 'post_expiry')),
        scheduled_date TIMESTAMP NOT NULL,
        sent_status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_branch ON leads(branch_id);
      CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
      CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
      CREATE INDEX IF NOT EXISTS idx_members_branch ON members(branch_id);
      CREATE INDEX IF NOT EXISTS idx_payments_branch ON payments(branch_id);
      CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
      CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    `);

    console.log('✅ All tables created successfully');
    
    // Insert default lead sources
    await pool.query(`
      INSERT INTO lead_sources (name, type) VALUES
        ('Meta Ads', 'meta_ads'),
        ('Website Form', 'website'),
        ('Manual Entry', 'manual'),
        ('Referral', 'referral'),
        ('Walk-in', 'walkin')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default plans
    await pool.query(`
      INSERT INTO plans (name, duration_months, price, description) VALUES
        ('Monthly', 1, 999, 'One month access to all facilities'),
        ('Quarterly', 3, 2499, 'Three months with savings'),
        ('Half Yearly', 6, 4499, 'Six months best value'),
        ('Annual', 12, 10000, 'Full year - Best savings!')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert default branches
    await pool.query(`
      INSERT INTO branches (name, address, phone) VALUES
        ('Gerugambakkam', '123 Main Road, Gerugambakkam, Chennai', '9876543210'),
        ('Kundrathur', '456 High Road, Kundrathur, Chennai', '9876543211'),
        ('Pozhichalur', '789 Middle Street, Pozhichalur, Chennai', '9876543212'),
        ('Porur', '123 RTO Road, Porur, Chennai', '9876543213'),
        ('Ramapuram', '456 Mount Road, Ramapuram, Chennai', '9876543214'),
        ('Iyyappanthangal', '789 Vinayagar Street, Iyyappanthangal, Chennai', '9876543215'),
        ('Kolapakkam', '123 Garden Road, Kolapakkam, Chennai', '9876543216')
      ON CONFLICT (name) DO NOTHING
    `);

    console.log('✅ Default data inserted successfully');
    
    // Create default owner user (password: admin123)
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES ('owner@ironmanfitness.com', $1, 'Super Admin', '9876500000', 'owner')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash]);

    console.log('✅ Default owner user created (email: owner@ironmanfitness.com, password: admin123)');
    
    await pool.end();
    console.log('✅ IRONMAN FITNESS Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDB();
}

module.exports = { initDB };

