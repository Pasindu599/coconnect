import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Matches `firestoreDatabaseId` in ../../firebase-applet-config.json, which
 * src/lib/firebase.ts (the client) passes to its own getFirestore() call.
 * `getFirestore()` with no second argument defaults to the `(default)`
 * database — a DIFFERENT, empty database from the client's. Every Function
 * must use this helper, never bare `getFirestore()`, or its writes are
 * invisible to the app. Found the hard way via
 * tests/integration/awardBid.test.ts: a real HTTP call succeeded and wrote
 * exactly where asked, but the client listener and even a plain client
 * getDocs() of the "same" collection saw nothing, because they were
 * different databases. See DECISIONS.md ADR-010.
 */
export const DATABASE_ID = 'ai-studio-coconnectlabourh-64bcd1b2-b9e4-4043-a5eb-7636c3097373';

export function getDb(): Firestore {
  return getFirestore(DATABASE_ID);
}
