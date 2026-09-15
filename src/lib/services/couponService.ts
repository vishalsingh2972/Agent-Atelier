import { prisma } from '../db';

export async function validateCoupon(code: string) {
  if (!code || code.trim() === '') {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return {
      valid: false,
      error: 'INVALID_COUPON',
      message: `Coupon code "${code}" is invalid or expired.`,
    };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return {
      valid: false,
      error: 'COUPON_EXPIRED',
      message: `Coupon code "${code}" has expired.`,
    };
  }

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxDiscount: coupon.maxDiscount,
      minSpend: coupon.minSpend,
    },
    message: `Applied ${coupon.code} (${coupon.discountPercent}% off discount)!`,
  };
}
