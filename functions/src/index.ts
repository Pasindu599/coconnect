import { initializeApp } from 'firebase-admin/app';

initializeApp();

// Functions are added per task: auth/* (S1-05), payments/* (S1-09, S1-10),
// escrow/* (S1-11, S1-12). This file re-exports each once it exists.
