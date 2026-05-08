const { Pool } = require('pg');
const config = require('../config');

const initDB = async () => {
  const connStr = config.db.connectionString;
  if (!connStr) {
    console.error('❌ DATABASE_URL is not set. Skipping DB init.');
    return;
  }

  // Admin pool — connect to base "postgres" db to ensure gym_db exists
  const adminStr = connStr.replace(/\/[^/?]+(\?|$)/, '/postgres$1');
  const adminPool = new Pool({ connectionString: adminStr, ssl: false });

  try {
    const dbName = connStr.match(/\/([^/?]+)(\?|$)/)?.[1];
    if (dbName) {
      const dbCheck = await adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );
      if (dbCheck.rows.length === 0) {
        await adminPool.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Database ${dbName} created`);
      }
    }
    await adminPool.end();

    // Now connect to the gym database
    const pool = new Pool({ connectionString: connStr, ssl: false });

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

      -- Users (Staff)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'sales', 'accountant', 'receptionist')),
        branch_id UUID,
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

      -- FK: users -> branches
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

      -- Lead Timeline
      CREATE TABLE IF NOT EXISTS lead_timeline (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT,
        performed_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Trainers
      CREATE TABLE IF NOT EXISTS trainers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        specialization VARCHAR(100),
        salary DECIMAL(10,2),
        branch_id UUID REFERENCES branches(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Members
      CREATE TABLE IF NOT EXISTS members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        gender VARCHAR(10),
        age INTEGER,
        dob DATE,
        address TEXT,
        membership_id VARCHAR(50),
        branch_id UUID REFERENCES branches(id),
        plan_id UUID REFERENCES plans(id),
        joining_date DATE NOT NULL,
        plan_start_date DATE NOT NULL,
        plan_end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'frozen', 'cancelled')),
        last_check_in TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        pt_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
        pt_joining_date DATE,
        pt_end_date DATE,
        pt_sessions_total INTEGER DEFAULT 0,
        pt_sessions_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Attendance (proper check-in/check-out log)
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        branch_id UUID REFERENCES branches(id),
        check_in TIMESTAMP NOT NULL DEFAULT NOW(),
        check_out TIMESTAMP,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
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
        payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'upi', 'card', 'online', 'razorpay')),
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

      -- Renewal Reminders
      CREATE TABLE IF NOT EXISTS renewal_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        member_id UUID REFERENCES members(id),
        reminder_type VARCHAR(20) CHECK (reminder_type IN ('7_days', '3_days', 'expiry', 'post_expiry')),
        scheduled_date TIMESTAMP NOT NULL,
        sent_status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Software Subscriptions (gym pays to use this SaaS platform)
      CREATE TABLE IF NOT EXISTS software_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('monthly', 'half_yearly', 'yearly')),
        amount DECIMAL(10,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
        payment_id VARCHAR(150),
        order_id VARCHAR(150),
        razorpay_signature VARCHAR(300),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Gateway Transactions (Razorpay order log)
      CREATE TABLE IF NOT EXISTS gateway_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id VARCHAR(150) NOT NULL UNIQUE,
        payment_id VARCHAR(150),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
        purpose VARCHAR(50) DEFAULT 'payment',
        reference_id TEXT,
        signature VARCHAR(300),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Password Reset Tokens
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Migrate existing members table (safe — IF NOT EXISTS skips if column already present)
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='dob') THEN
          ALTER TABLE members ADD COLUMN dob DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='membership_id') THEN
          ALTER TABLE members ADD COLUMN membership_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='pt_trainer_id') THEN
          ALTER TABLE members ADD COLUMN pt_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL;
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

      -- Indexes
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
      CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_branch ON attendance(branch_id);
      CREATE INDEX IF NOT EXISTS idx_gateway_order ON gateway_transactions(order_id);
    `);

    console.log('✅ All tables created successfully');

    // Default data
    await pool.query(`
      INSERT INTO lead_sources (name, type) VALUES
        ('Meta Ads', 'meta_ads'),('Website Form', 'website'),
        ('Manual Entry', 'manual'),('Referral', 'referral'),('Walk-in', 'walkin')
      ON CONFLICT (name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO plans (name, duration_months, price, description) VALUES
        ('Monthly',    1,  999,   'One month access to all facilities'),
        ('Quarterly',  3,  2499,  'Three months with savings'),
        ('Half Yearly',6,  4499,  'Six months best value'),
        ('Annual',     12, 10000, 'Full year - Best savings!')
      ON CONFLICT (name) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO branches (name, address, phone) VALUES
        ('Gerugambakkam','123 Main Road, Gerugambakkam, Chennai','9876543210'),
        ('Kundrathur','456 High Road, Kundrathur, Chennai','9876543211'),
        ('Pozhichalur','789 Middle Street, Pozhichalur, Chennai','9876543212'),
        ('Porur','123 RTO Road, Porur, Chennai','9876543213'),
        ('Ramapuram','456 Mount Road, Ramapuram, Chennai','9876543214'),
        ('Iyyappanthangal','789 Vinayagar Street, Iyyappanthangal, Chennai','9876543215'),
        ('Kolapakkam','123 Garden Road, Kolapakkam, Chennai','9876543216')
      ON CONFLICT (name) DO NOTHING
    `);

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin123', 12);
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES ('owner@ironmanfitness.com', $1, 'Super Admin', '9876500000', 'owner')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash]);

    console.log('✅ Default data inserted. owner@ironmanfitness.com / admin123');
    await pool.end();
    console.log('✅ IRONMAN FITNESS Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  initDB();
}

module.exports = { initDB };
