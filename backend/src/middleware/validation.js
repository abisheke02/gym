const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      console.error('Validation failed:', errors);
      return res.status(400).json({ error: 'Validation failed', errors });
    }
    
    next();
  };
};

// Auth schemas
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    role: Joi.string().valid('owner', 'manager', 'sales', 'accountant'),
    branch_id: Joi.string().uuid(),
  }),
};

// Branch schemas
const branchSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().max(500),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    manager_id: Joi.string().uuid(),
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    address: Joi.string().max(500),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    manager_id: Joi.string().uuid(),
    is_active: Joi.boolean(),
  }),
};

// Lead schemas
const leadSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
    email: Joi.string().email(),
    gender: Joi.string().valid('male', 'female', 'other'),
    age: Joi.number().min(10).max(100),
    address: Joi.string().max(500),
    source_id: Joi.string().uuid(),
    branch_id: Joi.string().uuid(),
    notes: Joi.string().max(1000).allow('', null),
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    email: Joi.string().email(),
    gender: Joi.string().valid('male', 'female', 'other'),
    age: Joi.number().min(10).max(100),
    address: Joi.string().max(500),
    source_id: Joi.string().uuid(),
    branch_id: Joi.string().uuid(),
    assigned_to: Joi.string().uuid(),
    status: Joi.string().valid('new', 'contacted', 'visited', 'trial', 'joined', 'lost'),
    notes: Joi.string().max(1000),
  }),
  
  assign: Joi.object({
    assigned_to: Joi.string().uuid().required(),
  }),
  
  followup: Joi.object({
    follow_up_schedule: Joi.date().iso().required(),
    notes: Joi.string().max(500),
  }),
  
  whatsapp: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
  }),
};

// Member schemas
const memberSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
    email: Joi.string().email(),
    gender: Joi.string().valid('male', 'female', 'other'),
    age: Joi.number().min(10).max(100),
    address: Joi.string().max(500),
    branch_id: Joi.string().uuid().required(),
    plan_id: Joi.string().uuid().required(),
    joining_date: Joi.date().iso().required(),
    plan_start_date: Joi.date().iso().required(),
    plan_end_date: Joi.date().iso().required(),
    membership_id: Joi.string().allow('', null).optional(),
    amount: Joi.number().min(0).optional(),
    payment_mode: Joi.string().valid('cash', 'upi', 'card').optional(),
    pt_trainer_id: Joi.string().uuid().allow(null).optional(),
    pt_joining_date: Joi.date().iso().allow(null).optional(),
    pt_end_date: Joi.date().iso().allow(null).optional(),
    pt_sessions_total: Joi.number().min(0).optional(),
    pt_sessions_completed: Joi.number().min(0).optional(),
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/),
    email: Joi.string().email().allow('', null).optional(),
    gender: Joi.string().valid('male', 'female', 'other').allow('', null).optional(),
    age: Joi.number().min(10).max(100).allow(null).optional(),
    address: Joi.string().max(500).allow('', null).optional(),
    branch_id: Joi.string().uuid(),
    plan_id: Joi.string().uuid(),
    plan_start_date: Joi.date().iso(),
    plan_end_date: Joi.date().iso(),
    status: Joi.string().valid('active', 'expired', 'frozen', 'cancelled'),
    membership_id: Joi.string().allow('', null).optional(),
    pt_trainer_id: Joi.string().uuid().allow(null).optional(),
    pt_joining_date: Joi.date().iso().allow(null).optional(),
    pt_end_date: Joi.date().iso().allow(null).optional(),
    pt_sessions_total: Joi.number().min(0).optional(),
    pt_sessions_completed: Joi.number().min(0).optional(),
  }),
};

// Plan schemas
const planSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    duration_months: Joi.number().min(1).max(36).required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().max(500),
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    duration_months: Joi.number().min(1).max(36),
    price: Joi.number().min(0),
    description: Joi.string().max(500),
    is_active: Joi.boolean(),
  }),
};

// Payment schemas
const paymentSchemas = {
  create: Joi.object({
    member_id: Joi.string().uuid().required(),
    amount: Joi.number().min(0).required(),
    payment_mode: Joi.string().valid('cash', 'upi', 'card', 'online').required(),
    transaction_id: Joi.string().max(100),
    discount_amount: Joi.number().min(0).default(0),
    notes: Joi.string().max(500),
    branch_id: Joi.string().uuid().required(),
  }),
};

// Expense schemas
const expenseSchemas = {
  create: Joi.object({
    branch_id: Joi.string().uuid().required(),
    category: Joi.string().valid('salary', 'rent', 'utilities', 'ads', 'maintenance', 'supplies', 'other').required(),
    amount: Joi.number().min(0).required(),
    description: Joi.string().max(500),
    expense_date: Joi.date().iso().required(),
  }),
  
  update: Joi.object({
    category: Joi.string().valid('salary', 'rent', 'utilities', 'ads', 'maintenance', 'supplies', 'other'),
    amount: Joi.number().min(0),
    description: Joi.string().max(500),
    expense_date: Joi.date().iso(),
  }),
};

module.exports = {
  validate,
  authSchemas,
  branchSchemas,
  leadSchemas,
  memberSchemas,
  planSchemas,
  paymentSchemas,
  expenseSchemas,
};

