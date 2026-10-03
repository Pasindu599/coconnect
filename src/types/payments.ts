// Payment contract types (.claude/docs/plans/CONTRACTS.md, C4). Shared by the checkout UI and
// the Cloud Functions; change only by agreement, in a PR titled with [contract].

/** What the PayHere checkout needs. Built and signed server-side; the merchant secret never reaches the browser. */
export interface PayHereCheckout {
  sandbox: boolean;
  merchant_id: string;
  /** The payment this checkout belongs to; the webhook looks it up by this value. */
  order_id: string;
  items: string;
  /** Exactly two decimals, no thousands separator, e.g. "35700.00" (bid price + platform fee). */
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

export interface FeeBreakdown {
  /** The bidder's accepted price. */
  bidPrice: number;
  platformFee: number;
  /** bidPrice + platformFee: what the poster pays. */
  total: number;
  currency: 'LKR';
}
