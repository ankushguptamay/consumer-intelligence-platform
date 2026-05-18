'use strict';

const express = require('express');

const authRoutes = require('./auth.routes');
const brandRoutes = require('./brand.routes');
const userRoutes = require('./user.routes');
const eventRoutes = require('./event.routes');
const segmentationRoutes = require('./segmentation.routes');
const propensityRoutes = require('./propensity.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/brands', brandRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/segments', segmentationRoutes);
router.use('/propensity', propensityRoutes);

module.exports = router;
