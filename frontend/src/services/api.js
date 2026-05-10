import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  signup: (data) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Branches API
export const branchesAPI = {
  getAll: () => api.get('/branches'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Leads API
export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
  assign: (id, assigned_to) => api.post(`/leads/${id}/assign`, { assigned_to }),
  scheduleFollowUp: (id, data) => api.post(`/leads/${id}/followup`, data),
  sendWhatsApp: (id, message) => api.post(`/leads/${id}/whatsapp`, { message }),
  convertToMember: (id, data) => api.post(`/leads/${id}/convert`, data),
  getFollowUps: () => api.get('/leads/followups'),
  getSources: () => api.get('/leads/meta/sources'),
  bulkUpload: (formData) => api.post('/leads/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Members API
export const membersAPI = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  checkIn: (id) => api.post(`/members/${id}/checkin`),
  renew: (id, data) => api.post(`/members/${id}/renew`, data),
  getInactive: () => api.get('/members/inactive/list'),
  getExpiring: (days) => api.get('/members/expiring/list', { params: { days } }),
  getStats: (branchId) => api.get('/members/stats/summary', { params: { branch_id: branchId } }),
};

// Plans API
export const plansAPI = {
  getAll: () => api.get('/plans'),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

// Trainers API
export const trainersAPI = {
  getAll: (params) => api.get('/trainers', { params }),
  create: (data) => api.post('/trainers', data),
  update: (id, data) => api.put(`/trainers/${id}`, data),
  delete: (id) => api.delete(`/trainers/${id}`),
};

// Finance API
export const financeAPI = {
  // Payments
  getPayments: (params) => api.get('/payments', { params }),
  recordPayment: (data) => api.post('/payments', data),
  
  // Expenses
  getExpenses: (params) => api.get('/expenses', { params }),
  recordExpense: (data) => api.post('/expenses', data),
  
  // Reports
  getDailyCollection: (params) => api.get('/reports/daily-collection', { params }),
  getMonthlyRevenue: (params) => api.get('/reports/monthly-revenue', { params }),
  getBranchPL: (params) => api.get('/reports/branch-pnl', { params }),
  getNetIncome: (params) => api.get('/reports/net-income', { params }),
  getCashflow: (params) => api.get('/reports/cashflow', { params }),
  getAdROI: (params) => api.get('/reports/roi-ads', { params }),
  
  // Dashboard
  getDashboardSummary: (branchId) => api.get('/dashboard/summary', { params: { branch_id: branchId } }),
  getReceptionistSummary: (branchId) => api.get('/dashboard/receptionist-summary', { params: { branch_id: branchId } }),
  getKPIs: (branchId) => api.get('/dashboard/kpis', { params: { branch_id: branchId } }),
  getWeeklyLeads: (branchId) => api.get('/dashboard/weekly-leads', { params: { branch_id: branchId } }),
};

// Subscription API (gym's SaaS subscription)
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  getHistory: () => api.get('/subscriptions/history'),
  createOrder: (data) => api.post('/subscriptions/create-order', data),
  verifyPayment: (data) => api.post('/subscriptions/verify-payment', data),
};

// Payment Gateway API (Razorpay for member payments)
export const gatewayAPI = {
  createOrder: (data) => api.post('/gateway/create-order', data),
  verify: (data) => api.post('/gateway/verify', data),
  getTransactions: (params) => api.get('/gateway/transactions', { params }),
};

// Messaging API
export const messagingAPI = {
  getHistory: (params) => api.get('/messaging/history', { params }),
  sendBulk: (data) => api.post('/messaging/send-bulk', data),
};

// Attendance API
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getList: (params) => api.get('/attendance', { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  getMemberHistory: (memberId) => api.get(`/attendance/member/${memberId}`),
};

export default api;

