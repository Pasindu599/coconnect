import net from 'node:net';
import { loadLocalEnv } from '../../scripts/lib/env';

loadLocalEnv();

// Node gives each resolved address only 250 ms to connect before trying the
// next ("happy eyeballs"); on a slow or IPv6-less network every attempt then
// times out and requests fail with "fetch failed". Allow 5 s per address.
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);
