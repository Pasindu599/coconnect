import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { type Transaction } from 'firebase-admin/firestore';
import { getDb } from '../db.js';
import { isValidCategoryRole, type CategoryId, type CategoryRoleId } from './roles.js';

export interface AddMembershipInput {
  category: CategoryId;
  role: CategoryRoleId;
}

interface Membership {
  category: string;
  role: string;
}

function sameMembership(a: Membership, b: Membership): boolean {
  return a.category === b.category && a.role === b.role;
}

// CONTRACTS C3: addMembership never writes roles directly from the client.
// Rejects `admin` outright (there is no admin CategoryRoleId), validates the
// role against the category, and is idempotent on repeat calls.
export const addMembership = onCall<AddMembershipInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { category, role } = request.data ?? ({} as AddMembershipInput);
  if (!category || !role || !isValidCategoryRole(category, role)) {
    throw new HttpsError('invalid-argument', `"${role}" is not a valid role for category "${category}".`);
  }

  const uid = request.auth.uid;
  const membership: Membership = { category, role };
  const db = getDb();
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx: Transaction) => {
    const snap = await tx.get(userRef);
    const existing: Membership[] = (snap.exists ? snap.data()?.memberships : undefined) ?? [];
    const next = existing.some((m) => sameMembership(m, membership)) ? existing : [...existing, membership];
    tx.set(userRef, { memberships: next }, { merge: true });
  });

  // Mirror onto the custom claim so Firestore rules can authorize from the
  // ID token (cheap) instead of a get() on every rule evaluation — see
  // ADR-006. The client must force-refresh its token after this resolves.
  const authAdmin = getAuth();
  const userRecord = await authAdmin.getUser(uid);
  const claims = userRecord.customClaims ?? {};
  const existingClaimed: Membership[] = claims.memberships ?? [];
  const nextClaimed = existingClaimed.some((m) => sameMembership(m, membership))
    ? existingClaimed
    : [...existingClaimed, membership];
  await authAdmin.setCustomUserClaims(uid, { ...claims, memberships: nextClaimed });

  return { ok: true };
});
