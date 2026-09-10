const { Prisma } = require('@prisma/client');

const normalizeCouponCode = (value) => String(value || '').trim().toUpperCase();

const getCouponError = (coupon, subtotal) => {
  if (!coupon) return 'Invalid coupon code.';
  if (!coupon.isActive) return 'This coupon is no longer active.';
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) return 'This coupon has expired.';
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return 'This coupon has reached its usage limit.';
  if (subtotal < Number(coupon.minimumOrderAmount)) return `Minimum order value for this coupon is ${new Prisma.Decimal(coupon.minimumOrderAmount).toFixed(2)}.`;
  if (!['PERCENTAGE', 'FIXED'].includes(coupon.discountType) || Number(coupon.discountValue) <= 0) return 'This coupon is not configured correctly.';
  return null;
};

const calculateDiscount = (coupon, subtotal) => {
  const rawDiscount = coupon.discountType === 'PERCENTAGE'
    ? subtotal * Number(coupon.discountValue) / 100
    : Number(coupon.discountValue);
  const cappedDiscount = coupon.maximumDiscount === null ? rawDiscount : Math.min(rawDiscount, Number(coupon.maximumDiscount));
  return Math.max(0, Math.min(subtotal, cappedDiscount));
};

const validateCoupon = async (prisma, code, subtotal) => {
  const normalizedCode = normalizeCouponCode(code);
  const parsedSubtotal = Number(subtotal);
  if (!normalizedCode) return { error: 'Please enter a coupon code.' };
  if (!Number.isFinite(parsedSubtotal) || parsedSubtotal < 0) return { error: 'A valid cart total is required.' };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalizedCode } });
  const error = getCouponError(coupon, parsedSubtotal);
  if (error) return { error };

  const discount = Number(calculateDiscount(coupon, parsedSubtotal).toFixed(2));
  return {
    coupon,
    code: coupon.code,
    discount,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    message: 'Coupon applied successfully.',
  };
};

module.exports = { normalizeCouponCode, validateCoupon, calculateDiscount };