/**
 * CONTRACTS.md C7 (see that file for the full write-up). Thin wrappers
 * around the confirm_completion / open_dispute / resolve_dispute /
 * record_payout SQL functions (supabase/migrations/*_functions.sql). No
 * logic of its own, same spirit as payments.ts.
 *
 * Errors: these reject with `BackendError` (src/lib/supabase.ts), whose
 * `.code` is the same clean string the Cloud Functions used
 * (`permission-denied`, `not-found`, `failed-precondition`,
 * `invalid-argument`, `resource-exhausted`, `internal`, `unauthenticated`).
 * CONTRACTS.md C7 lists exactly which codes each function can throw.
 */
import { callRpc } from './supabase';

/** held -> release_requested, with a server-side hashed-PIN check. Codes: unauthenticated, invalid-argument, not-found, permission-denied (not the owner, or wrong PIN), failed-precondition (not pending), resource-exhausted (too many wrong attempts). */
export async function confirmCompletion(completionId: string, pin: string): Promise<void> {
  await callRpc('confirm_completion', { p_completion_id: completionId, p_pin: pin });
}

/** held|release_requested -> disputed. Codes: unauthenticated, invalid-argument, not-found, permission-denied (not a party to the award), failed-precondition (not disputable from the current escrow status). */
export async function openDispute(awardId: string, reason: string): Promise<{ disputeId: string }> {
  return callRpc<{ disputeId: string }>('open_dispute', { p_award_id: awardId, p_reason: reason });
}

/** Admin only. disputed -> refunded|released. Codes: permission-denied (not an admin), invalid-argument, not-found, failed-precondition (already resolved, or no paid payment to refund), internal (refunds are not available yet — dispute stays open, see payments.md). */
export async function resolveDispute(disputeId: string, resolution: 'refunded' | 'released'): Promise<void> {
  await callRpc('resolve_dispute', { p_dispute_id: disputeId, p_resolution: resolution });
}

/** Admin only. release_requested -> released. Codes: permission-denied (not an admin), invalid-argument, not-found, failed-precondition (not awaiting payout). */
export async function recordPayout(awardId: string, bankTransferRef: string): Promise<{ payoutAmount: number }> {
  const result = await callRpc<{ ok: true; payoutAmount: number }>('record_payout', {
    p_award_id: awardId,
    p_bank_transfer_ref: bankTransferRef,
  });
  return { payoutAmount: Number(result.payoutAmount) };
}

/** Sets the signed-in user's completion PIN (4-6 digits, stored hashed). Codes: unauthenticated, invalid-argument. */
export async function setCompletionPin(pin: string): Promise<void> {
  await callRpc('set_completion_pin', { p_pin: pin });
}
