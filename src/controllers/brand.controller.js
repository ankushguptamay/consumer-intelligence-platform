"use strict";

const brandService = require("../services/brand.service");
const { sendResponse } = require("../utils/apiResponse");

const list = async (req, res, next) => {
  try {
    const result = await brandService.list({
      ...req.query,
      admin_id: req.admin.id,
    });
    return sendResponse(res, 200, result.items, "Brands fetched", {
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
    const brand = await brandService.getById(req.params.id);
    return sendResponse(res, 200, brand, "Brand fetched");
  } catch (err) {
    return next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const brand = await brandService.create({
      ...req.body,
      admin_id: req.admin.id,
    });
    return sendResponse(res, 201, brand, "Brand created");
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const brand = await brandService.update(req.params.id, {
      ...req.body,
      admin_id: req.admin.id,
    });
    return sendResponse(res, 200, brand, "Brand updated");
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await brandService.remove(req.params.id);
    return sendResponse(res, 200, result, "Brand deactivated");
  } catch (err) {
    return next(err);
  }
};

module.exports = { list, get, create, update, remove };
