import { callRpc } from '../supabase';
import type { Award } from '../../types';

export interface ReconciliationRow {
  awardId: string;
  escrowStatus: Award['escrow_status'];
  held: number;
  releasedOrRefunded: number;
  stillInEscrow: number;
  balanced: boolean;
}

interface ReconcileAwardsRow {
  award_id: string;
  escrow_status: Award['escrow_status'];
  held: number;
  released_or_refunded: number;
  still_in_escrow: number;
  balanced: boolean;
}

/**
 * Admin only (payments.md's "Reconciliation query"); reconcile_awards()
 * refuses anyone else with `permission-denied`. For each award, sum(hold)
 * should equal sum(release)+sum(refund), plus escrow_amount still in escrow
 * if not yet released/refunded. A mismatch means a bug, not a user error;
 * this is a read-only diagnostic for an admin dashboard.
 */
export async function reconcileAwards(): Promise<ReconciliationRow[]> {
  const rows = await callRpc<ReconcileAwardsRow[]>('reconcile_awards', {});
  return (rows ?? []).map((row) => ({
    awardId: row.award_id,
    escrowStatus: row.escrow_status,
    held: Number(row.held),
    releasedOrRefunded: Number(row.released_or_refunded),
    stillInEscrow: Number(row.still_in_escrow),
    balanced: row.balanced,
  }));
}
