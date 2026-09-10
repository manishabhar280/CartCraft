const express = require('express');
const {
  getDashboard,
  getAdminOrders,
  updateOrderStatus,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminUsers,
} = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect, requireAdmin);
router.get('/dashboard', getDashboard);
router.get('/orders', getAdminOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.get('/users', getAdminUsers);

module.exports = router;
