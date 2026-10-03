/**
 * CONTRACTS.md C4. Delivers SP5. Mirrors functions/src/payments/
 * {createPayment,payhere}.ts's output shape exactly — this file does no
 * computation of its own, the Function is the only source of truth for the
 * fee and the signed hash.
 *
 * Types come from src/types/payments.ts (Session 2's file, also C4) rather
 * than being redefined here — S2 asked for this in CONTRACTS.md so the
 * checkout UI and this module can't drift apart on the same contract.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { PayHereCheckout, FeeBreakdown } from '../types/payments';

export type { PayHereCheckout, FeeBreakdown };

interface CreatePaymentOutput {
  checkout: PayHereCheckout;
  fees: FeeBreakdown;
}

const createPaymentCallable = httpsCallable<{ awardId: string }, CreatePaymentOutput>(functions, 'createPayment');

export async function createPayment(awardId: string): Promise<CreatePaymentOutput> {
  const result = await createPaymentCallable({ awardId });
  return result.data;
}
