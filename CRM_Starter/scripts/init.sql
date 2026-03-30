-- SQL Script for CRM Starter Project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & RBAC
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Organizations & Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CRM Core (Plans, Leads & Members)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'joined', 'lost')),
    source VARCHAR(100),
    branch_id UUID REFERENCES branches(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    gender VARCHAR(20),
    age INTEGER,
    address TEXT,
    branch_id UUID REFERENCES branches(id),
    plan_id UUID REFERENCES plans(id),
    joining_date DATE NOT NULL,
    plan_start_date DATE NOT NULL,
    plan_end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'frozen', 'cancelled')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Financials
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('cash', 'upi', 'card', 'online')),
    transaction_id VARCHAR(100),
    recorded_by UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Default Data
INSERT INTO roles (name) VALUES ('owner'), ('manager'), ('staff') ON CONFLICT DO NOTHING;
