const { Prisma } = require('@prisma/client');
const { validateCoupon } = require('../utils/coupon');

const parseRequestedItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items.map((item) => {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
      throw Object.assign(new Error('Valid product items are required'), { statusCode: 400 });
    }
    return { productId, quantity };
  });
};
const { prisma } = require('../utils/prisma');

const createOrder = async (req, res, next) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const requestedItems = parseRequestedItems(req.body?.items);
      let cart = null;
      let items;

      if (requestedItems) {
        const products = await tx.product.findMany({ where: { id: { in: requestedItems.map((item) => item.productId) } } });
        const productsById = new Map(products.map((product) => [product.id, product]));
        if (products.length !== requestedItems.length) throw Object.assign(new Error('One or more products were not found'), { statusCode: 404 });
        items = requestedItems.map((item) => ({ ...item, product: productsById.get(item.productId) }));
      } else {
        cart = await tx.cart.findUnique({ where: { userId: req.user.id }, include: { items: { include: { product: true } } } });
        if (!cart || cart.items.length === 0) throw Object.assign(new Error('Cart is empty'), { statusCode: 400 });
        items = cart.items;
      }

      const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
      let couponResult = null;
      if (req.body?.couponCode) {
        couponResult = await validateCoupon(tx, req.body.couponCode, subtotal);
        if (couponResult.error) throw Object.assign(new Error(couponResult.error), { statusCode: 400 });
      }
      const discount = couponResult?.discount || 0;
      const total = Math.max(0, subtotal - discount);

      if (couponResult) {
        const usageWhere = couponResult.coupon.usageLimit === null
          ? { id: couponResult.coupon.id }
          : { id: couponResult.coupon.id, usedCount: { lt: couponResult.coupon.usageLimit } };
        const updatedCoupon = await tx.coupon.updateMany({
          where: usageWhere,
          data: { usedCount: { increment: 1 } },
        });
        if (updatedCoupon.count !== 1) throw Object.assign(new Error('This coupon has reached its usage limit.'), { statusCode: 400 });
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          status: 'PENDING',
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          discount: new Prisma.Decimal(discount.toFixed(2)),
          couponCode: couponResult?.code || null,
          couponId: couponResult?.coupon.id || null,
          total: new Prisma.Decimal(total.toFixed(2)),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: new Prisma.Decimal(Number(item.product.price).toFixed(2)),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};
