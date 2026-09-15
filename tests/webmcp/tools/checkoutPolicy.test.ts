import { describe, expect, it } from 'vitest';
import { validateDemoCheckoutSubmission } from '../../../src/lib/checkoutPolicy';

describe('demo checkout policy', () => {
  it('rejects non-demo payment methods', () => {
    expect(validateDemoCheckoutSubmission({ paymentMethod: 'OTHER', demoOrderConfirmed: true })).toMatchObject({
      valid: false,
      error: 'DEMO_PAYMENT_ONLY',
    });
  });

  it('requires explicit confirmation before a demo order can be created', () => {
    expect(validateDemoCheckoutSubmission({ paymentMethod: 'DEMO_CARD' })).toMatchObject({
      valid: false,
      error: 'DEMO_ORDER_CONFIRMATION_REQUIRED',
    });
  });

  it('accepts the explicit demo-only checkout flow', () => {
    expect(validateDemoCheckoutSubmission({ paymentMethod: 'DEMO_CARD', demoOrderConfirmed: true })).toEqual({
      valid: true,
      paymentMethod: 'DEMO_CARD',
    });
  });
});
