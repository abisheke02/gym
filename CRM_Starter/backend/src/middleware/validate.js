const Joi = require('joi');

const leadSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
  email: Joi.string().email().allow('', null),
  status: Joi.string().valid('new', 'contacted', 'visited', 'joined', 'lost'),
  source: Joi.string().max(100).allow('', null),
  branch_id: Joi.string().uuid().allow('', null),
  notes: Joi.string().max(1000).allow('', null)
});

const validateLead = (req, res, next) => {
  const { error } = leadSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

module.exports = { validateLead };
