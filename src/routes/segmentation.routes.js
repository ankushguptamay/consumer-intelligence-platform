'use strict';

const express = require('express');
const ctrl = require('../controllers/segmentation.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/recompute', ctrl.recompute);
router.get('/:key/users', ctrl.users);

module.exports = router;
