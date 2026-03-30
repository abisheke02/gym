# IRONMAN FITNESS Gym CRM - Technical Specification

## 1. Project Overview

**Project Name:** IRONMAN FITNESS Gym CRM
**Type:** Multi-branch Gym Management System (CRM + Sales + Finance)
**Core Functionality:** Lead management with WhatsApp automation, member lifecycle tracking, billing, and financial reporting
**Target Users:** Budget gym brand in Chennai with 7 branches
**Target Audience:** Owner, Branch Managers, Sales Staff, Accountants

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│  React + Tailwind Dashboard (Port 3000)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                   │
│  Node.js Express Server (Port 5000)                                    │
│  - JWT Authentication                                                   │
│  - Role-Based Access Control (RBAC)                                    │
│  - Rate Limiting                                                        │
│  - Request Validation                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐           ┌───────────────┐
│  Webhook      │         │  Scheduler    │           │  WhatsApp     │
│  Service      │         │  Service      │           │  Service      │
│  (Meta Leads) │         │  (Cron Jobs)  │           │  (Meta API)   │
└───────────────┘         └───────────────┘           └───────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                 │
│  PostgreSQL (Port 5432)                                                │
│  - Primary DB: gym_db                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users (Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'sales', 'accountant')),
    branch_id UUID REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lead Sources
CREATE TABLE lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('meta_ads', 'website', 'manual', 'referral', 'walkin')),
    is_active BOOLEAN DEFAULT true
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE lead_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    member_id UUID REFERENCES members(id),
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    message_text TEXT,
    message_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Members
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    category VARCHAR(50) NOT NULL CHECK (category IN ('salary', 'rent', 'utilities', 'ads', 'maintenance', 'supplies', 'other')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Renewals Tracking
CREATE TABLE renewal_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    reminder_type VARCHAR(20) CHECK (reminder_type IN ('7_days', '3_days', 'expiry', 'post_expiry')),
    scheduled_date TIMESTAMP NOT NULL,
    sent_status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API Endpoints

### 4.1 Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/login | User login | Public |
| POST | /api/auth/register | Register new user | Owner |
| GET | /api/auth/me | Get current user | Auth |

### 4.2 Branches
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/branches | List all branches | All |
| POST | /api/branches | Create branch | Owner |
| GET | /api/branches/:id | Get branch details | Manager+ |
| PUT | /api/branches/:id | Update branch | Owner |
| DELETE | /api/branches/:id | Delete branch | Owner |

### 4.3 Leads
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/webhooks/meta-lead | Meta lead ads webhook | Public |
| POST | /api/leads | Create lead manually | Sales+ |
| GET | /api/leads | List leads (filtered) | Sales+ |
| GET | /api/leads/:id | Get lead details | Sales+ |
| PUT | /api/leads/:id | Update lead status | Sales+ |
| POST | /api/leads/:id/assign | Assign lead to staff | Manager+ |
| POST | /api/leads/:id/followup | Schedule follow-up | Sales+ |
| POST | /api/leads/:id/whatsapp | Send WhatsApp message | Sales+ |

### 4.4 Members
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/members | List members | Sales+ |
| POST | /api/members | Create member | Sales+ |
| GET | /api/members/:id | Get member details | Sales+ |
| PUT | /api/members/:id | Update member | Sales+ |
| POST | /api/members/:id/checkin | Check-in member | Staff |
| GET | /api/members/inactive | List inactive members | Manager+ |

### 4.5 Plans
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/plans | List plans | All |
| POST | /api/plans | Create plan | Owner |
| PUT | /api/plans/:id | Update plan | Owner |

### 4.6 Payments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/payments | List payments | Accountant+ |
| POST | /api/payments | Record payment | Accountant+ |
| GET | /api/payments/branch/:branchId | Branch payments | Manager+ |

### 4.7 Expenses
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/expenses | List expenses | Accountant+ |
| POST | /api/expenses | Record expense | Accountant+ |
| GET | /api/expenses/branch/:branchId | Branch expenses | Manager+ |

### 4.8 Reports
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/reports/daily-collection | Daily collections | Manager+ |
| GET | /api/reports/monthly-revenue | Monthly revenue | Manager+ |
| GET | /api/reports/branch-pnl | Branch P&L | Owner |
| GET | /api/reports/net-income | Net income | Owner |
| GET | /api/reports/roi-ads | ROI on ads | Owner |
| GET | /api/reports/export/:type | Export to Excel/PDF | Manager+ |

### 4.9 Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/dashboard/summary | Dashboard summary | Manager+ |
| GET | /api/dashboard/kpis | KPI metrics | Manager+ |

---

## 5. WhatsApp Message Templates

### 5.1 Lead Auto-Reply (within 30 seconds)
```
Namaste {name}! 🙏

Thank you for your interest in IRONMAN FITNESS Gym! We're thrilled to have you reach out.

🏋️ We're a budget-friendly gym with the best equipment in Chennai. 
Our plans start at just ₹999/month!

📍 Visit any of our 7 branches:
- Gerugambakkam, Kundrathur, Pozhichalur, and more...

Would you like to:
1. Book a FREE trial session?
2. Visit our gym today?
3. Know more about our plans?

Reply with 1, 2, or 3 and our team will assist you within 10 minutes!

- Team IRONMAN FITNESS 💪
```

### 5.2 SLA Breach Alert (to Manager/Owner)
```
🚨 URGENT: Lead Response Required

Lead: {name}
Phone: {phone}
Source: {source}
Assigned to: {staff_name}

⏰ 10-minute SLA BREACHED!
Lead has not been contacted yet.

Please respond immediately to avoid losing this lead!

- IRONMAN FITNESS CRM Alert
```

### 5.3 Follow-up Templates

**+2 Hours Follow-up:**
```
Hi {name}! Just checking in - did you get a chance to visit our gym? 

Our team is ready to show you around! Let us know your preferred time. 😊

- Team IRONMAN FITNESS
```

**Next Day Morning:**
```
Good Morning {name}! ☀️

Hope you're having a great day! 

Still interested in starting your fitness journey with us? 
Book your FREE trial today - limited slots available!

Reply YES to connect with our team.

- Team IRONMAN FITNESS
```

**Next Day Evening:**
```
Hi {name}! 🌟

Don't let your fitness goals wait! 

Join IRONMAN FITNESS Gym today and get:
✅ Free personal training session
✅ Modern equipment
✅ Expert trainers

Book your visit now!

- Team IRONMAN FITNESS
```

### 5.4 Visit Booking Confirmation
```
🎉 Your Visit Confirmed!

Name: {name}
Branch: {branch}
Date: {date}
Time: {time}

Our team will be waiting for you! 

What to bring: Comfortable clothes, water bottle, ID proof.

See you soon! 💪

- Team IRONMAN FITNESS
```

### 5.5 Trial to Join Conversion
```
🎊 WELCOME TO IRONMAN FITNESS FAMILY! 🎊

Namaste {name}!

Thank you for joining us! Here's your membership details:

📋 Plan: {plan_name}
💰 Amount Paid: ₹{amount}
📅 Valid Until: {end_date}

Your fitness journey starts NOW! Let's crush those goals! 💪

- Team IRONMAN FITNESS
```

### 5.6 Renewal Reminders

**7 Days Before Expiry:**
```
Hi {name}! ⏰

Your IRONMAN FITNESS membership expires in 7 days ({expiry_date}).

Renew now to continue your fitness journey without interruption!

💰 Renewal Plans:
- Monthly: ₹{monthly_price}
- Quarterly: ₹{quarterly_price}
- Annual: ₹{annual_price} (Best Value!)

Reply RENEW to book your slot!

- Team IRONMAN FITNESS
```

**3 Days Before Expiry:**
```
{🔥} FINAL REMINDER {🔥}

Hi {name}!

Only 3 days left on your IRONMAN FITNESS membership!

Don't lose your progress - renew today and get:
✅ Continuity in your workout
✅ Exclusive renewal discounts
✅ No waiting period

Reply NOW to renew!

- Team IRONMAN FITNESS
```

**On Expiry Day:**
```
Hi {name},

Your IRONMAN FITNESS membership has expired today. 

We'd love to have you back! 
Renew within 7 days to avail special comeback offers!

Reply COMEBACK for exclusive deals!

- Team IRONMAN FITNESS
```

**3 Days After Expiry:**
```
We Miss You {name}! 😢

It's been 3 days since your last workout. 

Your body (and fitness goals) miss you! 

Special offer for you:
🎁 20% OFF on any plan this week!

Come back stronger! 💪

- Team IRONMAN FITNESS
```

### 5.7 Inactive Member Reactivation
```
😢 We Miss You, {name}!

It's been 5 days since your last check-in at IRONMAN FITNESS.

Every workout counts! Don't break your streak now!

🔥 Book your next session and get:
- Free personal training consultation
- Customized workout plan

Are you coming back? Let us know! 😊

- Team IRONMAN FITNESS
```

---

## 6. UI Pages & Wireframes

### 6.1 Authentication Pages
- **Login Page**: Email, password, remember me, forgot password link
- **Register Page**: Full form for new staff registration (Owner only)

### 6.2 Dashboard Pages
- **Owner Dashboard**: All branches overview, total revenue, total members, leads, alerts
- **Manager Dashboard**: Branch-specific metrics, team performance, daily reports
- **Sales Dashboard**: My leads, follow-ups due today, conversion stats

### 6.3 Lead Management Pages
- **Lead List**: Kanban view + List view, filters (source, status, date, branch, assigned)
- **Lead Detail**: Full profile, timeline, WhatsApp chat history, follow-up scheduler
- **Lead Add**: Manual lead creation form
- **Lead Pipeline**: Visual pipeline (new → contacted → visited → trial → joined)

### 6.4 Member Management Pages
- **Member List**: Table with search, filters (status, branch, plan)
- **Member Detail**: Profile, payment history, check-in log, documents
- **Member Add**: Registration form with plan selection

### 6.5 Billing & Finance Pages
- **Payments**: Payment recording, transaction history
- **Expenses**: Expense entry, category management
- **Reports**: 
  - Daily Collections Report
  - Monthly Revenue Report
  - Branch-wise P&L
  - Net Income Statement
  - Cashflow Analysis
  - Ad ROI Calculator

### 6.6 Settings Pages
- **Branch Management**: CRUD for branches
- **Staff Management**: User CRUD, role assignment
- **Plan Management**: Membership plans CRUD
- **WhatsApp Settings**: Message templates, API configuration
- **Notification Settings**: Alert preferences

---

## 7. Security Best Practices

1. **Authentication**: JWT with short expiry (15 min access, 7 day refresh)
2. **Password**: Bcrypt hashing with salt rounds 12
3. **RBAC**: Role checks on every protected endpoint
4. **Input Validation**: Joi/express-validator on all inputs
5. **SQL Injection**: Parameterized queries only (pg module)
6. **CORS**: Whitelist specific domains
7. **Rate Limiting**: 100 req/min general, 10 req/min auth
8. **Audit Logging**: Log all sensitive operations
9. **Data Encryption**: TLS 1.3 for transit, encryption at rest for PII
10. **WhatsApp Privacy**: Store only last 4 digits of phone, mask in logs

---

## 8. Analytics KPIs

| KPI | Description | Formula |
|-----|-------------|---------|
| Lead Conversion Rate | % leads converted to members | (Joined Leads / Total Leads) × 100 |
| Response Time | Avg time to first contact | SLA breach duration avg |
| Daily Collections | Revenue per day | Sum of daily payments |
| Member Retention | % members renewing | (Renewed / Expiring) × 100 |
| Revenue per Member | Avg revenue per active member | Total Revenue / Active Members |
| Branch Performance | Revenue per branch | Branch Revenue / Branch Members |
| Expense Ratio | Expenses as % of revenue | (Total Expenses / Total Revenue) × 100 |
| Net Profit Margin | Net income / Revenue | (Revenue - Expenses) / Revenue × 100 |
| Trial to Join Rate | % trial members joining | (Joined from Trial / Total Trial) × 100 |
| Ad ROI | Return on ad spend | (Revenue from Ads - Ad Cost) / Ad Cost × 100 |

---

## 9. Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + node-postgres
- **Auth**: JWT + bcryptjs
- **WhatsApp**: Meta Cloud API
- **Scheduler**: node-cron
- **Notifications**: Firebase Cloud Messaging
- **Payments**: Razorpay (future)
- **Excel Export**: xlsx + exceljs
- **PDF Export**: pdfkit
- **Docker**: docker-compose for local dev

---

## 10. Deployment

- **Development**: docker-compose up (dev environment)
- **Production**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions for testing and building

