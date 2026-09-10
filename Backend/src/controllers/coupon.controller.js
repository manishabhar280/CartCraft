const { prisma } = require('../utils/prisma');
const { validateCoupon } = require('../utils/coupon');

const validateCouponCode = async (req, res, next) => {
  try {
    const result = await validateCoupon(prisma, req.body?.code, req.body?.cartTotal);
    if (result.error) return res.status(400).json({ success: false, valid: false, message: result.error });
    return res.status(200).json({
      success: true,
      valid: true,
      code: result.code,
      discount: result.discount,
      discountType: result.discountType,
      message: result.message,
    });
  } catch (error) { return next(error); }
};

module.exports = { validateCouponCode };