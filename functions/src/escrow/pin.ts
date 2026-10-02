import bcrypt from 'bcryptjs';

/**
 * Closes KNOWN_ISSUES #3's completion-side half: never plaintext. There is
 * no real "set your completion PIN" step in the new phone-OTP registration
 * flow yet (S1-05) — flagged in SESSION_1_BACKEND.md's S1-11 note as a gap
 * for Session 2's registration UI. Until then, `scripts/seed.ts` sets a
 * hashed demo PIN directly via the Admin SDK, the same way it bootstraps
 * the first admin.
 */
export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
