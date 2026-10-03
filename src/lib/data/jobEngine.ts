import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface AwardBidInput {
  bidId: string;
  awardId: string;
}

const awardBidCallable = httpsCallable<AwardBidInput, { awardId: string }>(functions, 'awardBid');

/**
 * Thin wrapper around the awardBid Function — see functions/src/jobs/awardBid.ts
 * for why this can't be a plain client write. `awardId` must be the same
 * client-generated id store.ts's optimistic local Award already uses, so
 * the sync listener reconciles them as one record.
 */
export async function awardBid(bidId: string, awardId: string): Promise<void> {
  await awardBidCallable({ bidId, awardId });
}
