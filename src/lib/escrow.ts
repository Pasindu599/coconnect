/**
 * CONTRACTS.md C7 (see that file for the full write-up). Thin wrappers
 * around functions/src/escrow/{confirmCompletion,openDispute,resolveDispute,
 * recordPayout}.ts — no logic of its own, same spirit as payments.ts.
 *
 * Errors: these reject with Firebase's own `FunctionsError`, whose `.code`
 * is already a clean string (`permission-denied`, `not-found`,
 * `failed-precondition`, `invalid-argument`, `resource-exhausted`,
 * `internal`, `unauthenticated`) — no extra wrapping on top, unlike
 * `auth.ts`'s `AuthError`. CONTRACTS.md C7 lists exactly which codes each
 * function can throw and what each one means, since the mock these replace
 * used a different, bespoke set of string codes.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const confirmCompletionCallable = httpsCallable<{ completionId: string; pin: string }, { ok: true }>(
  functions,
  'confirmCompletion'
);
const openDisputeCallable = httpsCallable<{ awardId: string; reason: string }, { disputeId: string }>(
  functions,
  'openDispute'
);
const resolveDisputeCallable = httpsCallable<
  { disputeId: string; resolution: 'refunded' | 'released' },
  { ok: true }
>(functions, 'resolveDispute');
const recordPayoutCallable = httpsCallable<{ awardId: string; bankTransferRef: string }, { ok: true; payoutAmount: number }>(
  functions,
  'recordPayout'
);

/** held -> release_requested, with a server-side hashed-PIN check. Codes: unauthenticated, invalid-argument, not-found, permission-denied (not the owner, or wrong PIN), failed-precondition (not pending), resource-exhausted (too many wrong attempts). */
export async function confirmCompletion(completionId: string, pin: string): Promise<void> {
  await confirmCompletionCallable({ completionId, pin });
}

/** held|release_requested -> disputed. Codes: unauthenticated, invalid-argument, not-found, permission-denied (not a party to the award), failed-precondition (not disputable from the current escrow status). */
export async function openDispute(awardId: string, reason: string): Promise<{ disputeId: string }> {
  const result = await openDisputeCallable({ awardId, reason });
  return result.data;
}

/** Admin only. disputed -> refunded|released. Codes: permission-denied (not an admin), invalid-argument, not-found, failed-precondition (already resolved, or no paid payment to refund), internal (the PayHere refund call itself failed — dispute stays open, see payments.md). */
export async function resolveDispute(disputeId: string, resolution: 'refunded' | 'released'): Promise<void> {
  await resolveDisputeCallable({ disputeId, resolution });
}

/** Admin only. release_requested -> released. Codes: permission-denied (not an admin), invalid-argument, not-found, failed-precondition (not awaiting payout). */
export async function recordPayout(awardId: string, bankTransferRef: string): Promise<{ payoutAmount: number }> {
  const result = await recordPayoutCallable({ awardId, bankTransferRef });
  return { payoutAmount: result.data.payoutAmount };
}
