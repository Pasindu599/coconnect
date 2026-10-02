import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

export interface SetAdminInput {
  uid: string;
}

// Admin-gated: only an existing admin can grant the claim. There is no
// public path to becoming the *first* admin — see specs/auth.md's
// "Bootstrapping the first admin" note (scripts/seed.ts on the emulator,
// or a one-off Admin SDK script against a real project).
export const setAdmin = onCall<SetAdminInput>(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Only an existing admin can grant admin.');
  }

  const { uid } = request.data ?? ({} as SetAdminInput);
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required.');
  }

  const authAdmin = getAuth();
  const target = await authAdmin.getUser(uid);
  await authAdmin.setCustomUserClaims(uid, { ...(target.customClaims ?? {}), admin: true });

  return { ok: true };
});
