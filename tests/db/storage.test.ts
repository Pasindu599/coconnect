/** The private `nic` bucket (supabase/migrations/*_storage.sql; CONTRACTS C5). */
import { afterAll, describe, expect, it } from 'vitest';
import { anon, cleanup, createTestUser } from './helpers';

afterAll(cleanup);

// A 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

describe('storage: nic/{uid}/*', () => {
  it('the owner uploads and reads their own image; a stranger cannot read it; an admin can', async () => {
    const me = await createTestUser();
    const stranger = await createTestUser();
    const staff = await createTestUser({ isAdmin: true });
    const path = `${me.id}/front.png`;

    const upload = await me.client.storage.from('nic').upload(path, PNG, { contentType: 'image/png', upsert: true });
    expect(upload.error).toBeNull();
    expect((await me.client.storage.from('nic').createSignedUrl(path, 60)).error).toBeNull();
    expect((await stranger.client.storage.from('nic').download(path)).error).not.toBeNull();
    expect((await staff.client.storage.from('nic').createSignedUrl(path, 60)).error).toBeNull();
  });

  it('cannot upload into someone else\'s folder, or a non-image', async () => {
    const me = await createTestUser();
    const other = await createTestUser();
    expect((await me.client.storage.from('nic').upload(`${other.id}/front.png`, PNG, { contentType: 'image/png' })).error).not.toBeNull();
    expect(
      (await me.client.storage.from('nic').upload(`${me.id}/back.png`, Buffer.from('hello'), { contentType: 'text/plain' })).error
    ).not.toBeNull();
  });

  it('unauthenticated requests are denied', async () => {
    const me = await createTestUser();
    expect((await anon.storage.from('nic').upload(`${me.id}/front.png`, PNG, { contentType: 'image/png' })).error).not.toBeNull();
  });
});
