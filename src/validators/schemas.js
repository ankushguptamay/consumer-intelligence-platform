'use strict';

const Joi = require('joi');

// --- Auth ---
const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

const logout = Joi.object({
  refresh_token: Joi.string().optional(),
  all_devices: Joi.boolean().optional().default(false),
});

const changePassword = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { name: 'complexity' })
    .required()
    .messages({
      'string.pattern.name':
        'New password must contain at least one lowercase letter, one uppercase letter, and one digit',
    }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Confirm password must match the new password',
  }),
});

// --- Brand ---
const createBrand = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .min(2)
    .max(160)
    .required(),
  is_active: Joi.boolean().optional(),
});

const updateBrand = createBrand.fork(['name', 'slug'], (s) => s.optional());

// --- User ---
const upsertUser = Joi.object({
  email: Joi.string().email().allow(null, '').optional(),
  phone: Joi.string().max(20).allow(null, '').optional(),
  first_name: Joi.string().max(80).allow(null, '').optional(),
  last_name: Joi.string().max(80).allow(null, '').optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').allow(null).optional(),
  date_of_birth: Joi.date().iso().allow(null).optional(),
  city: Joi.string().max(80).allow(null, '').optional(),
  brand_id: Joi.number().integer().positive().optional(),
}).or('email', 'phone'); // at least one identity key

const registerToBrand = Joi.object({
  brand_id: Joi.number().integer().positive().required(),
});

// --- Event ---
const recordEvent = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  brand_id: Joi.number().integer().positive().required(),
  event_type: Joi.string()
    .valid('PURCHASE', 'APP_OPEN', 'PRODUCT_VIEW', 'CONTENT_VIEW')
    .required(),
  amount: Joi.number()
    .min(0)
    .when('event_type', { is: 'PURCHASE', then: Joi.required(), otherwise: Joi.optional() }),
  occurred_at: Joi.date().iso().optional(),
});

module.exports = {
  login,
  logout,
  changePassword,
  createBrand,
  updateBrand,
  upsertUser,
  registerToBrand,
  recordEvent,
};
