import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { onUserCreate } from './auth/onUserCreate.js';
export { addMembership } from './auth/addMembership.js';
export { setAdmin } from './auth/setAdmin.js';
export { awardBid } from './jobs/awardBid.js';
export { createPayment } from './payments/createPayment.js';

// Functions are added per task: payments/* (S1-10), escrow/*
// (S1-11, S1-12). This file re-exports each once it exists.
