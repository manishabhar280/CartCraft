const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getReviews,
  createReview,
  deleteReview,
} = require('../controllers/product.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, requireAdmin, createProduct);
router.put('/:id', protect, requireAdmin, updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, createReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

module.exports = router;
