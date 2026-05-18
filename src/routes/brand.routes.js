'use strict';

const express = require('express');
const ctrl = require('../controllers/brand.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

// Mutations on brands (all admins can perform these)
router.post('/', validate(schemas.createBrand), ctrl.create);
router.patch('/:id', validate(schemas.updateBrand), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
