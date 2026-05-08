require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET must be set in production');
  process.exit(1);
}
if (isProd && !process.env.ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD must be set in production');
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    connectionString: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  },

  meta: {
    verifyToken: process.env.META_VERIFY_TOKEN,
    appSecret: process.env.META_APP_SECRET,
  },

  fcm: {
    projectId: process.env.FCM_PROJECT_ID,
    privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FCM_CLIENT_EMAIL,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'noreply@ironmanfitness.com',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  leadResponseSLA: parseInt(process.env.LEAD_RESPONSE_SLA) || 10,
  defaultAnnualPrice: parseInt(process.env.DEFAULT_ANNUAL_PRICE) || 10000,
  adminPassword: process.env.ADMIN_PASSWORD || 'dev_admin_change_me',
};

