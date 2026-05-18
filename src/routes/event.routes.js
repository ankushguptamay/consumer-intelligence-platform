'use strict';

const express = require('express');
const ctrl = require('../controllers/event.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', validate(schemas.recordEvent), ctrl.record);

module.exports = router;
