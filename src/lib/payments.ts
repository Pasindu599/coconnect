/**
 * CONTRACTS.md C4. Delivers SP5. Mirrors functions/src/payments/
 * {createPayment,payhere}.ts's output shape exactly — this file does no
 * computation of its own, the Function is the only source of truth for the
 * fee and the signed hash.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface PayHereCheckout {
  sandbox: boolean;
  merchant_id: string;
  order_id: string; // = payments/{id}
  items: string;
  amount: string; // "35700.00" (bid price + platform fee)
  currency: 'LKR';
  hash: string; // signed server-side
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
  bidPrice: number;
  platformFee: number;
  total: number;
  currency: 'LKR';
}

interface CreatePaymentOutput {
  checkout: PayHereCheckout;
  fees: FeeBreakdown;
}

const createPaymentCallable = httpsCallable<{ awardId: string }, CreatePaymentOutput>(functions, 'createPayment');

export async function createPayment(awardId: string): Promise<CreatePaymentOutput> {
  const result = await createPaymentCallable({ awardId });
  return result.data;
}
