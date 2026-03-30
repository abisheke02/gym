require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    connectionString: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'ironman_jwt_secret_key_2024',
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

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  leadResponseSLA: parseInt(process.env.LEAD_RESPONSE_SLA) || 10,
  
  defaultAnnualPrice: parseInt(process.env.DEFAULT_ANNUAL_PRICE) || 10000,
  adminPassword: process.env.ADMIN_PASSWORD || 'abiadmin',
};

