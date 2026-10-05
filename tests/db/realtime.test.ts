/**
 * Realtime (what store.startSync() listens to): changes reach the parties,
 * and RLS filters the feed, so a sealed bid never reaches a rival bidder.
 */
import { afterAll, describe, expect, it } from 'vitest';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { bidder, bidRow, cleanup, estateRow, jobRow, ok, poster, uid } from './helpers';

afterAll(cleanup);

/** Subscribes to INSERTs on `table`, resolving once the channel is live. Collects received row ids. */
async function listen(client: SupabaseClient, table: string): Promise<{ ids: string[]; channel: RealtimeChannel }> {
  await client.realtime.setAuth();
  const ids: string[] = [];
  const channel = client
    .channel(uid(`test-${table}`))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
      ids.push(String((payload.new as { id: string }).id));
    });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Realtime subscribe timed out on ${table}`)), 20_000);
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer);
        reject(err ?? new Error(status));
      }
    });
  });
  return { ids, channel };
}

async function waitFor(condition: () => boolean, ms = 20_000) {
  const start = Date.now();
  while (!condition() && Date.now() - start < ms) await new Promise((r) => setTimeout(r, 250));
}

describe('realtime', () => {
  it('delivers a new bid to the job owner and the bidder, never to a rival bidder', async () => {
    const owner = await poster();
    const broker = await bidder();
    const rival = await bidder();

    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    const job = jobRow(owner.id, estate.id);
    await ok(owner.client.from('jobs').insert(job));

    const [ownerFeed, brokerFeed, rivalFeed] = await Promise.all([
      listen(owner.client, 'bids'),
      listen(broker.client, 'bids'),
      listen(rival.client, 'bids'),
    ]);
    // SUBSCRIBED arrives slightly before the server starts delivering changes for the channel.
    await new Promise((r) => setTimeout(r, 3_000));

    const bid = bidRow(job.id, owner.id, broker.id);
    await ok(broker.client.from('bids').insert(bid));

    await waitFor(() => ownerFeed.ids.includes(bid.id) && brokerFeed.ids.includes(bid.id));
    // Give a leaked event the same time to arrive before asserting it didn't.
    await new Promise((r) => setTimeout(r, 2_000));

    expect(ownerFeed.ids).toContain(bid.id);
    expect(brokerFeed.ids).toContain(bid.id);
    expect(rivalFeed.ids).not.toContain(bid.id);

    for (const [client, feed] of [[owner.client, ownerFeed], [broker.client, brokerFeed], [rival.client, rivalFeed]] as const) {
      await client.removeChannel(feed.channel);
    }
  });
});
