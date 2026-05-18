"use strict";

const { Op } = require("sequelize");
const { Brand, Admin } = require("../models");
const { AppError } = require("../utils/apiResponse");

const list = async ({ admin_id, is_active, page = 1, limit = 20 }) => {
  const where = { admin_id };
  if (is_active !== undefined)
    where.is_active = is_active === "true" || is_active === true;

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Brand.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [["id", "ASC"]],
  });
  return {
    items: rows,
    total: count,
    page: Number(page),
    limit: Number(limit),
  };
};

const getById = async (id) => {
  const brand = await Brand.findByPk(id);
  if (!brand) throw new AppError("Brand not found", 404);
  return brand;
};

const create = async (data) => {
  if (data.admin_id) {
    const admin = await Admin.findByPk(data.admin_id);
    if (!admin) throw new AppError("Admin not found", 400);
  }
  const existing = await Brand.findOne({ where: { slug: data.slug } });
  if (existing) throw new AppError("Slug already in use", 409);
  return Brand.create(data);
};

const update = async (id, data) => {
  const brand = await Brand.findByPk(id);
  if (!brand) throw new AppError("Brand not found", 404);

  if (data.slug && data.slug !== brand.slug) {
    const dup = await Brand.findOne({
      where: { slug: data.slug, id: { [Op.ne]: id } },
    });
    if (dup) throw new AppError("Slug already in use", 409);
  }

  if (data.admin_id) {
    const admin = await Admin.findByPk(data.admin_id);
    if (!admin) throw new AppError("Admin not found", 400);
  }

  await brand.update(data);
  return brand;
};

const remove = async (id) => {
  const brand = await Brand.findByPk(id);
  if (!brand) throw new AppError("Brand not found", 404);
  await brand.update({ is_active: false });
  return { id: brand.id, is_active: false };
};

module.exports = { list, getById, create, update, remove };
