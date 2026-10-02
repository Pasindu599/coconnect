import { createHash } from 'node:crypto';
import type { CheckoutParams, PaymentProvider } from './provider.js';

function md5(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

/**
 * Per PayHere's documented v1 checkout hash. Re-verify against PayHere's
 * current docs once sandbox access exists (1C-4) — written from the spec in
 * .claude/docs/specs/payments.md, not yet checked against a live sandbox.
 */
export function computeHash(merchantId: string, orderId: string, amount: string, currency: string, merchantSecret: string): string {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  return md5(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`).toUpperCase();
}

/** PayHere requires exactly 2 decimals, no thousands separator. */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * The notify-webhook signature, per PayHere's documented formula — same
 * shape as the checkout hash but with status_code folded in before the
 * hashed secret. Re-verify against PayHere's current docs once sandbox
 * access exists (1C-4), same caveat as computeHash above.
 */
export function computeNotifySig(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  statusCode: string,
  merchantSecret: string
): string {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  return md5(`${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`).toUpperCase();
}

export interface PayHereConfig {
  merchantId: string;
  merchantSecret: string;
  sandbox: boolean;
}

export interface PayHereCheckout {
  sandbox: boolean;
  merchant_id: string;
  order_id: string;
  items: string;
  amount: string;
  currency: 'LKR';
  hash: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export class PayHereProvider implements PaymentProvider {
  constructor(private readonly config: PayHereConfig) {}

  buildCheckout(params: CheckoutParams): PayHereCheckout {
    const amount = formatAmount(params.amount);
    const hash = computeHash(this.config.merchantId, params.orderId, amount, params.currency, this.config.merchantSecret);

    return {
      sandbox: this.config.sandbox,
      merchant_id: this.config.merchantId,
      order_id: params.orderId,
      items: params.items,
      amount,
      currency: params.currency,
      hash,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      notify_url: params.notifyUrl,
      first_name: params.customer.firstName,
      last_name: params.customer.lastName,
      email: params.customer.email,
      phone: params.customer.phone,
      address: params.customer.address,
      city: params.customer.city,
      country: params.customer.country,
    };
  }
}
