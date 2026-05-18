'use strict';

const userService = require('../services/user.service');
const segmentationService = require('../services/segmentation.service');
const propensityService = require('../services/propensity.service');
const { sendResponse } = require('../utils/apiResponse');

const upsert = async (req, res, next) => {
  try {
    const user = await userService.upsertUser(req.body);
    return sendResponse(res, 200, user, 'User upserted');
  } catch (err) {
    return next(err);
  }
};

const registerToBrand = async (req, res, next) => {
  try {
    const result = await userService.registerToBrand(req.params.id, req.body.brand_id);
    return sendResponse(
      res,
      result.created ? 201 : 200,
      result.association,
      result.created ? 'User registered to brand' : 'Brand association already existed'
    );
  } catch (err) {
    return next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await userService.list(req.query);
    return sendResponse(res, 200, result.items, 'Users fetched', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    return next(err);
  }
};

const get = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    return sendResponse(res, 200, user, 'User fetched');
  } catch (err) {
    return next(err);
  }
};

const events = async (req, res, next) => {
  try {
    const data = await userService.recentEvents(req.params.id, req.query);
    return sendResponse(res, 200, data, 'User events fetched');
  } catch (err) {
    return next(err);
  }
};

const segmentsPreview = async (req, res, next) => {
  try {
    const data = await segmentationService.previewForUser(req.params.id);
    return sendResponse(res, 200, data, 'Segment preview for user');
  } catch (err) {
    return next(err);
  }
};

const propensity = async (req, res, next) => {
  try {
    const data = await propensityService.getForUser(req.params.id);
    return sendResponse(res, 200, data, 'Propensity score');
  } catch (err) {
    return next(err);
  }
};

module.exports = { upsert, registerToBrand, list, get, events, segmentsPreview, propensity };
