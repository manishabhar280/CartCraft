const express = require('express');
const { validateCouponCode } = require('../controllers/coupon.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/validate', protect, validateCouponCode);

module.exports = router;