import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onUserCreate } from './auth/onUserCreate.js';
export { addMembership } from './auth/addMembership.js';
export { setAdmin } from './auth/setAdmin.js';
export { awardBid } from './jobs/awardBid.js';
export { createPayment } from './payments/createPayment.js';
export { payhereNotify } from './payments/payhereNotify.js';
export { confirmCompletion } from './escrow/confirmCompletion.js';
export { openDispute } from './escrow/openDispute.js';
export { resolveDispute } from './escrow/resolveDispute.js';
export { recordPayout } from './escrow/recordPayout.js';
