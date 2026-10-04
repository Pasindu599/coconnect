import { callRpc } from '../supabase';

/**
 * Thin wrapper around award_bid() (supabase/migrations/*_functions.sql). It
 * can't be a plain client write: clients may not move a job past OPEN or
 * write awards at all. `awardId` must be the same client-generated id
 * store.ts's optimistic local Award already uses, so the sync listener
 * reconciles them as one record.
 */
export async function awardBid(bidId: string, awardId: string): Promise<void> {
  await callRpc('award_bid', { p_bid_id: bidId, p_award_id: awardId });
}
