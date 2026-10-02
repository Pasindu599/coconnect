// Functions unit tests run against the Auth + Firestore emulators (never
// production), per specs/auth.md's testing section. package.json's "test"
// script starts them via `firebase emulators:exec` before vitest runs.
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ??= 'demo-coconnect-functions-test';
