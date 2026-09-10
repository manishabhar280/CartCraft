const { Prisma } = require('@prisma/client');
const { prisma } = require('../utils/prisma');

const getCart = async (req, res, next) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = {
        id: null,
        userId: req.user.id,
        createdAt: null,
        updatedAt: null,
        items: [],
      };
    }

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body || {};

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity ?? 1);

    if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required',
      });
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    const product = await prisma.product.findUnique({ where: { id: parsedProductId } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: parsedProductId,
        },
      },
    });

    const item = existingItem
      ? await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + parsedQuantity },
        })
      : await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: parsedProductId,
            quantity: parsedQuantity,
          },
        });

    return res.status(200).json({
      success: true,
      message: 'Item added to cart',
      item,
    });
  } catch (error) {
    return next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const itemId = Number(req.params.id);
    const { quantity } = req.body || {};

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid cart item ID is required',
      });
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer',
      });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: parsedQuantity },
    });

    return res.status(200).json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid cart item ID is required',
      });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!item || item.cart.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return res.status(200).json({
      success: true,
      message: 'Cart item removed successfully',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
};
