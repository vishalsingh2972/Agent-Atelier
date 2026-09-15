export type DemoCheckoutPolicyResult =
  | { valid: true; paymentMethod: 'DEMO_CARD' }
  | { valid: false; error: 'DEMO_PAYMENT_ONLY' | 'DEMO_ORDER_CONFIRMATION_REQUIRED'; message: string };

export function validateDemoCheckoutSubmission(input: {
  paymentMethod?: unknown;
  demoOrderConfirmed?: unknown;
}): DemoCheckoutPolicyResult {
  if (input.paymentMethod && input.paymentMethod !== 'DEMO_CARD') {
    return {
      valid: false,
      error: 'DEMO_PAYMENT_ONLY',
      message: 'This demo checkout only supports the DEMO_CARD payment method.',
    };
  }

  if (input.demoOrderConfirmed !== true) {
    return {
      valid: false,
      error: 'DEMO_ORDER_CONFIRMATION_REQUIRED',
      message: 'Confirm the demo order before it can be created.',
    };
  }

  return { valid: true, paymentMethod: 'DEMO_CARD' };
}
