import { describe, expect, it } from 'vitest';
import { ESCROW_STEPS, contactsUnlocked, escrowProgress } from '../escrow';
import type { EscrowStatus } from '../../types';

describe('escrowProgress', () => {
  it.each<[EscrowStatus, number]>([
    ['pending', 1],
    ['held', 2],
    ['release_requested', 3],
    ['released', 4],
  ])('%s has reached %i step(s) and is not halted', (status, reached) => {
    expect(escrowProgress(status)).toEqual({ reached });
  });

  it('shows a dispute at the safe, earlier position and marks it halted', () => {
    expect(escrowProgress('disputed')).toEqual({ reached: 2, halted: 'disputed' });
  });

  it('marks a refund as halted', () => {
    expect(escrowProgress('refunded')).toEqual({ reached: 2, halted: 'refunded' });
  });

  it('never reaches past the last step', () => {
    for (const status of ['pending', 'held', 'release_requested', 'released', 'disputed', 'refunded'] as EscrowStatus[]) {
      expect(escrowProgress(status).reached).toBeLessThanOrEqual(ESCROW_STEPS.length);
    }
  });
});

describe('contactsUnlocked', () => {
  it('keeps crew contacts locked until the money is in escrow', () => {
    expect(contactsUnlocked('pending')).toBe(false);
  });

  it.each<EscrowStatus>(['held', 'release_requested', 'released', 'disputed'])('unlocks them at %s', status => {
    expect(contactsUnlocked(status)).toBe(true);
  });

  it('locks them again once the payment is refunded', () => {
    expect(contactsUnlocked('refunded')).toBe(false);
  });
});
