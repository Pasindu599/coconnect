import { auth } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';

// Auth-triggered (not Firestore-triggered): must exist before the client's
// first write to users/{uid}. See specs/auth.md for why this is a v1 (gen1)
// trigger rather than a v2 callable — Firebase doesn't yet offer a gen2
// equivalent of functions.auth.user().onCreate.
export const onUserCreate = auth.user().onCreate(async (user) => {
  const db = getFirestore();
  await db
    .collection('users')
    .doc(user.uid)
    .set(
      {
        phone: user.phoneNumber ?? null,
        email: user.email ?? null,
        name: user.displayName ?? '',
        memberships: [],
        nic_status: 'unverified',
        preferred_language: 'en',
        trust_score: 0,
        created_at: new Date().toISOString(),
      },
      { merge: true }
    );
});
