'use strict';

const eventService = require('../services/event.service');
const { sendResponse } = require('../utils/apiResponse');

const record = async (req, res, next) => {
  try {
    const event = await eventService.recordEvent(req.body);
    return sendResponse(res, 201, event, 'Event recorded');
  } catch (err) {
    return next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await eventService.list(req.query);
    return sendResponse(res, 200, result.items, 'Events fetched', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { record, list };
