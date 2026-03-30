# IRONMAN FITNESS Gym CRM

A premium multi-branch Gym CRM + Sales + Finance application for a budget gym brand in Chennai with 7 branches.

## Features

### Lead Management & Automation
- Lead capture from Meta Lead Ads, website forms, and manual entry
- WhatsApp auto-reply within 30 seconds
- 10-minute SLA timer with escalation alerts
- Round-robin lead assignment to sales staff
- Pipeline tracking: Lead → Visit → Trial → Join → Renewal

### Member Management
- Complete member profiles (name, phone, email, gender, age, address)
- Plan tracking with start/end dates
- Check-in functionality
- Renewal reminders: 7 days, 3 days, on expiry, 3 days post-expiry
- Inactive member reactivation (5 days no check-in)

### Billing & Finance
- Multiple payment modes: Cash, UPI, Card, Online
- Expense tracking: Salary, Rent, Utilities, Ads, Maintenance
- Reports: Daily collections, Monthly revenue, Branch P&L, Net Income, ROI

### Dashboard & Analytics
- Real-time KPIs: Conversion rate, Retention rate, Revenue per member
- Visual charts and graphs
- Daily summary notifications

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Auth**: JWT + Role-Based Access Control
- **WhatsApp**: Meta Cloud API
- **Scheduler**: node-cron

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Option 1: Local Development with Docker

```bash
# Clone the repository
cd gym

# Create .env files from examples
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database and API credentials

# Initialize database
npm run db:init

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

### Default Login Credentials
- **Email**: owner@ironmanfitness.com
- **Password**: admin123

## Project Structure

```
gym/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── db/             # Database connection & initialization
│   │   ├── middleware/     # Auth & validation middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   └── index.js        # Entry point
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── SPEC.md                 # Technical specification
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Owner only)
- `GET /api/auth/me` - Get current user

### Branches
- `GET /api/branches` - List all branches
- `POST /api/branches` - Create branch (Owner)
- `GET /api/branches/:id` - Get branch details

### Leads
- `POST /api/webhooks/meta-lead` - Meta lead ads webhook
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `PATCH /api/leads/:id/status` - Update lead status
- `POST /api/leads/:id/convert` - Convert to member

### Members
- `GET /api/members` - List members
- `POST /api/members` - Create member
- `POST /api/members/:id/checkin` - Check-in member
- `POST /api/members/:id/renew` - Renew membership

### Finance
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Record expense
- `GET /api/reports/daily-collection` - Daily collection report
- `GET /api/reports/branch-pnl` - Branch P&L report

## WhatsApp Message Templates

The system includes automated messages for:
- Lead auto-reply (within 30 seconds)
- SLA breach alerts
- Follow-up reminders
- Visit booking confirmations
- Trial to join conversion
- Renewal reminders (7 days, 3 days, expiry, post-expiry)
- Inactive member reactivation

## Role-Based Access Control

| Role     | Dashboard | Leads | Members | Finance | Reports | Settings | Branches |
|----------|-----------|-------|---------|---------|---------|----------|----------|
| Owner    | ✓         | ✓     | ✓       | ✓       | ✓       | ✓        | ✓        |
| Manager  | ✓         | ✓     | ✓       | ✓       | ✓       | ✓        | ✓        |
| Sales    | ✓         | ✓     | ✓       | -       | -       | ✓        | -        |
| Accountant| ✓        | -     | -       | ✓       | -       | ✓        | -        |

## Deployment

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# The build output will be in frontend/dist
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gym_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_jwt_secret
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
META_VERIFY_TOKEN=your_verify_token
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

## License

MIT License

