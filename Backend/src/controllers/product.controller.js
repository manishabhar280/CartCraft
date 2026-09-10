const { Prisma } = require('@prisma/client');
const { prisma } = require('../utils/prisma');

const parseProductId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw Object.assign(new Error('Valid product ID is required'), {
      statusCode: 400,
    });
  }
  return id;
};

const normalizePrice = (priceValue) => {
  const numericPrice = Number(priceValue);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    throw Object.assign(new Error('Valid product price is required'), {
      statusCode: 400,
    });
  }

  return new Prisma.Decimal(numericPrice.toFixed(2));
};

const parseReviewInput = (body = {}) => {
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Object.assign(new Error('Rating must be an integer from 1 to 5'), { statusCode: 400 });
  }
  if (!comment || comment.length > 1000) {
    throw Object.assign(new Error('Comment is required and must be 1000 characters or fewer'), { statusCode: 400 });
  }

  return { rating, comment };
};

const getReviews = async (req, res, next) => {
  try {
    const productId = parseProductId(req.params.id);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const deliveredItems = await prisma.orderItem.findMany({
      where: { productId, order: { status: 'DELIVERED' } },
      select: { order: { select: { userId: true } } },
      distinct: ['orderId'],
    });
    const verifiedUserIds = new Set(deliveredItems.map(({ order }) => order.userId));
    const ratings = reviews.map(({ rating }) => rating);
    const averageRating = ratings.length ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      distribution: [5, 4, 3, 2, 1].map((value) => ({ rating: value, count: ratings.filter((rating) => rating === value).length })),
      reviews: reviews.map((review) => ({ ...review, verifiedPurchase: verifiedUserIds.has(review.userId) })),
    });
  } catch (error) { return next(error); }
};

const createReview = async (req, res, next) => {
  try {
    const productId = parseProductId(req.params.id);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const { rating, comment } = parseReviewInput(req.body);
    const review = await prisma.review.create({
      data: { productId, userId: req.user.id, rating, comment },
      include: { user: { select: { id: true, name: true } } },
    });
    return res.status(201).json({ success: true, message: 'Review submitted successfully', review: { ...review, verifiedPurchase: await hasDeliveredPurchase(req.user.id, productId) } });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    return next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const reviewId = Number(req.params.reviewId);
    if (!Number.isInteger(reviewId) || reviewId <= 0) return res.status(400).json({ success: false, message: 'Valid review ID is required' });
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.productId !== parseProductId(req.params.id)) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.userId !== req.user.id) return res.status(403).json({ success: false, message: 'You can only delete your own review' });
    await prisma.review.delete({ where: { id: reviewId } });
    return res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) { return next(error); }
};

const hasDeliveredPurchase = async (userId, productId) => Boolean(await prisma.orderItem.findFirst({ where: { productId, order: { userId, status: 'DELIVERED' } }, select: { id: true } }));

const getProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = parseProductId(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, image, stock, category } = req.body || {};

    if (!name || !description || !price || !image || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, image, and category are required',
      });
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        price: normalizePrice(price),
        image: String(image).trim(),
        stock: Number(stock) || 0,
        category: String(category).trim(),
      },
    });

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = parseProductId(req.params.id);
    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const { name, description, price, image, stock, category } = req.body || {};
    const updateData = {};

    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (price !== undefined) updateData.price = normalizePrice(price);
    if (image !== undefined) updateData.image = String(image).trim();
    if (stock !== undefined) updateData.stock = Number(stock);
    if (category !== undefined) updateData.category = String(category).trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = parseProductId(req.params.id);
    const existingProduct = await prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      product: existingProduct,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getReviews,
  createReview,
  deleteReview,
};
