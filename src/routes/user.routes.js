'use strict';

const express = require('express');
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.get('/:id/events', ctrl.events);
router.get('/:id/segments-preview', ctrl.segmentsPreview);
router.get('/:id/propensity', ctrl.propensity);

// Upsert (create or merge by identity keys)
router.post('/', validate(schemas.upsertUser), ctrl.upsert);

// Add a brand registration to an existing user
router.post(
  '/:id/brand-associations',
  validate(schemas.registerToBrand),
  ctrl.registerToBrand
);

module.exports = router;
