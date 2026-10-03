import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Award } from '../../types';

export interface ReconciliationRow {
  awardId: string;
  escrowStatus: Award['escrow_status'];
  held: number;
  releasedOrRefunded: number;
  stillInEscrow: number;
  balanced: boolean;
}

/**
 * Admin-only (payments.md's "Reconciliation query"). A blanket read of
 * `ledger`/`awards` is fine here specifically because the caller is an
 * admin — firestore.rules' `isAdmin()` branch doesn't depend on the
 * document being read, so unlike the per-user-scoped collections (ADR-009),
 * Firestore can prove the rule holds for every document without a `where`
 * clause. Don't copy this pattern for a non-admin query.
 *
 * For each award: sum(hold) should equal sum(release)+sum(refund), plus
 * escrow_amount still sitting in escrow if not yet released/refunded. A
 * mismatch means a bug, not a user error — this is a read-only diagnostic
 * for an admin dashboard (not built in S1-12; this helper is).
 */
export async function reconcileAwards(): Promise<ReconciliationRow[]> {
  const [ledgerSnap, awardsSnap] = await Promise.all([getDocs(collection(db, 'ledger')), getDocs(collection(db, 'awards'))]);

  const sumsByAward = new Map<string, { hold: number; release: number; refund: number }>();
  ledgerSnap.forEach((doc) => {
    const entry = doc.data() as { award_id: string; type: string; amount: number };
    const sums = sumsByAward.get(entry.award_id) ?? { hold: 0, release: 0, refund: 0 };
    if (entry.type === 'hold') sums.hold += entry.amount;
    if (entry.type === 'release') sums.release += entry.amount;
    if (entry.type === 'refund') sums.refund += entry.amount;
    sumsByAward.set(entry.award_id, sums);
  });

  const rows: ReconciliationRow[] = [];
  awardsSnap.forEach((doc) => {
    const award = { id: doc.id, ...doc.data() } as Award;
    const sums = sumsByAward.get(award.id) ?? { hold: 0, release: 0, refund: 0 };
    const stillInEscrow = ['held', 'release_requested'].includes(award.escrow_status) ? award.escrow_amount : 0;
    const releasedOrRefunded = sums.release + sums.refund;

    rows.push({
      awardId: award.id,
      escrowStatus: award.escrow_status,
      held: sums.hold,
      releasedOrRefunded,
      stillInEscrow,
      balanced: sums.hold === releasedOrRefunded + stillInEscrow,
    });
  });

  return rows;
}
