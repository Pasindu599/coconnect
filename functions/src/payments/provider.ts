/**
 * ADR-002: keeps the gateway swappable. PayHere (functions/src/payments/payhere.ts)
 * is the only implementation today.
 */
export interface CheckoutCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface CheckoutParams {
  orderId: string;
  amount: number;
  currency: 'LKR';
  items: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  customer: CheckoutCustomer;
}

export interface PaymentProvider {
  buildCheckout(params: CheckoutParams): object;
}
