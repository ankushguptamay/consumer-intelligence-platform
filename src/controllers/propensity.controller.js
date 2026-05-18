'use strict';

const propensityService = require('../services/propensity.service');
const { sendResponse } = require('../utils/apiResponse');

const recompute = async (req, res, next) => {
  try {
    const data = await propensityService.recomputeAll();
    return sendResponse(res, 200, data, 'Propensity scores recomputed');
  } catch (err) {
    return next(err);
  }
};

const recomputeOne = async (req, res, next) => {
  try {
    const row = await propensityService.saveScoreForUser(req.params.id);
    return sendResponse(res, 200, row, 'Propensity score updated');
  } catch (err) {
    return next(err);
  }
};

const top = async (req, res, next) => {
  try {
    const data = await propensityService.top(req.query);
    return sendResponse(res, 200, data, 'Top propensity scores');
  } catch (err) {
    return next(err);
  }
};

module.exports = { recompute, recomputeOne, top };
