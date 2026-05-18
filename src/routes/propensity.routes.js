'use strict';

const express = require('express');
const ctrl = require('../controllers/propensity.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/top', ctrl.top);
router.post('/recompute', ctrl.recompute);
router.post('/recompute/:id', ctrl.recomputeOne);

module.exports = router;
