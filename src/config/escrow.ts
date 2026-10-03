import type { EscrowStatus } from '../types';

/**
 * How the UI reads an award's escrow status. Escrow moves only on the server (the payment
 * webhook and the escrow Functions); the UI shows it and gates on it, and never sets it.
 *
 *   pending -> held -> release_requested -> released
 *                 \-> disputed -> refunded | released
 */

export type EscrowStep = 'awarded' | 'in_escrow' | 'completion' | 'paid_out';

export const ESCROW_STEPS: EscrowStep[] = ['awarded', 'in_escrow', 'completion', 'paid_out'];

export interface EscrowProgress {
  /** How many of ESCROW_STEPS are done (1 = just awarded). */
  reached: number;
  /** Set when the money is frozen or returned instead of moving forward. */
  halted?: 'disputed' | 'refunded';
}

export const escrowProgress = (status: EscrowStatus): EscrowProgress => {
  switch (status) {
    case 'pending':
      return { reached: 1 };
    case 'held':
      return { reached: 2 };
    case 'release_requested':
      return { reached: 3 };
    case 'released':
      return { reached: 4 };
    // A dispute can start from `held` or `release_requested`; show the safe, earlier position.
    case 'disputed':
      return { reached: 2, halted: 'disputed' };
    case 'refunded':
      return { reached: 2, halted: 'refunded' };
  }
};

/** Crew contact details unlock once the money is held, and stay unlocked until it is returned. */
export const contactsUnlocked = (status: EscrowStatus): boolean =>
  status === 'held' || status === 'release_requested' || status === 'released' || status === 'disputed';
