'use strict';

const segmentationService = require('../services/segmentation.service');
const { sendResponse } = require('../utils/apiResponse');

const list = async (req, res, next) => {
  try {
    const data = await segmentationService.listSegments();
    return sendResponse(res, 200, data, 'Segments fetched');
  } catch (err) {
    return next(err);
  }
};

const recompute = async (req, res, next) => {
  try {
    const data = await segmentationService.recomputeAll(req.body?.user_id || null);
    return sendResponse(res, 200, data, 'Segments recomputed');
  } catch (err) {
    return next(err);
  }
};

const users = async (req, res, next) => {
  try {
    const result = await segmentationService.getSegmentUsers(req.params.key, req.query);
    return sendResponse(res, 200, result.items, `Users in segment ${req.params.key}`, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      segment: result.segment,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, recompute, users };
