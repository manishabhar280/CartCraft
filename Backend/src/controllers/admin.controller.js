const { Prisma } = require('@prisma/client');
const { prisma } = require('../utils/prisma');

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const parseId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw Object.assign(new Error(`Valid ${label} ID is required`), { statusCode: 400 });
  }
  return id;
};

const serializeProductInput = (body = {}, partial = false) => {
  const data = {};
  const required = ['name', 'description', 'image', 'category'];
  if (!partial && required.some((field) => !String(body[field] || '').trim())) {
    throw Object.assign(new Error('Name, description, image, and category are required'), { statusCode: 400 });
  }
  for (const field of required) {
    if (body[field] !== undefined) {
      const value = String(body[field]).trim();
      if (!value) throw Object.assign(new Error(`${field} is required`), { statusCode: 400 });
      data[field] = value;
    }
  }
  if (body.price !== undefined || !partial) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) throw Object.assign(new Error('Valid product price is required'), { statusCode: 400 });
    data.price = new Prisma.Decimal(price.toFixed(2));
  }
  if (body.stock !== undefined || !partial) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) throw Object.assign(new Error('Stock must be a non-negative integer'), { statusCode: 400 });
    data.stock = stock;
  }
  return data;
};

const getDashboard = async (req, res, next) => {
  try {
    const [users, products, orders, revenue, grouped] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, where: {} }),
    ]);
    const orderStats = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
    grouped.forEach((entry) => { orderStats[entry.status] = entry._count._all; });
    return res.json({ success: true, stats: { totalUsers: users, totalProducts: products, totalOrders: orders, totalRevenue: Number(revenue._sum.total || 0), orderStats } });
  } catch (error) { return next(error); }
};

const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) { return next(error); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'order');
    const status = String(req.body?.status || '').toUpperCase();
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Valid order status is required' });
    const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = await prisma.order.update({ where: { id }, data: { status }, include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } } });
    return res.json({ success: true, order });
  } catch (error) { return next(error); }
};

const getAdminProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, count: products.length, products });
  } catch (error) { return next(error); }
};

const createAdminProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.create({ data: serializeProductInput(req.body) });
    return res.status(201).json({ success: true, product });
  } catch (error) { return next(error); }
};

const updateAdminProduct = async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'product');
    if (!await prisma.product.findUnique({ where: { id }, select: { id: true } })) return res.status(404).json({ success: false, message: 'Product not found' });
    const product = await prisma.product.update({ where: { id }, data: serializeProductInput(req.body, true) });
    return res.json({ success: true, product });
  } catch (error) { return next(error); }
};

const deleteAdminProduct = async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'product');
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await prisma.product.delete({ where: { id } });
    return res.json({ success: true, product });
  } catch (error) {
    if (error.code === 'P2003') return res.status(409).json({ success: false, message: 'This product cannot be deleted because it is used by existing orders or carts' });
    return next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, count: users.length, users });
  } catch (error) { return next(error); }
};

module.exports = { getDashboard, getAdminOrders, updateOrderStatus, getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct, getAdminUsers };
