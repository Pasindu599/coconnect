/**
 * CONTRACTS.md C4. Delivers SP5. Calls the create-payment Edge Function
 * (supabase/functions/create-payment), which returns exactly this shape.
 * This file does no computation of its own: the server is the only source
 * of truth for the fee and the signed hash.
 *
 * Types come from src/types/payments.ts (Session 2's file, also C4) rather
 * than being redefined here, so the checkout UI and this module can't drift
 * apart on the same contract.
 *
 * Errors: BackendError (src/lib/supabase.ts) with unauthenticated,
 * invalid-argument, not-found, permission-denied, already-exists or internal.
 */
import { invokeFunction } from './supabase';
import type { PayHereCheckout, FeeBreakdown } from '../types/payments';

export type { PayHereCheckout, FeeBreakdown };

interface CreatePaymentOutput {
  checkout: PayHereCheckout;
  fees: FeeBreakdown;
}

export async function createPayment(awardId: string): Promise<CreatePaymentOutput> {
  return invokeFunction<CreatePaymentOutput>('create-payment', { awardId });
}
