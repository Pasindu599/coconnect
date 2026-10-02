import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  Firestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  connectAuthEmulator
} from 'firebase/auth';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';
import { Estate, LabourJob, NicSubmission } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config if present
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

/**
 * When VITE_USE_EMULATORS=true, point every Firebase client at the local
 * Emulator Suite (see `npm run emulators` / firebase.json) instead of the
 * real project. Guarded by a module-level flag because Vite's HMR can
 * re-run this module and connect*Emulator() throws if called twice on the
 * same instance.
 */
let emulatorsConnected = false;
if (import.meta.env.VITE_USE_EMULATORS === 'true' && !emulatorsConnected) {
  emulatorsConnected = true;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// Configure Google Auth Provider with Google Drive Scopes (Calendar and Chat removed)
export const googleProvider = new GoogleAuthProvider();

// Scopes for Google Drive cloud file backup & export
const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// Prompt consent to ensure refresh/access tokens
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// In-memory token cache (NEVER stored in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google authentication');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ----------------- FIRESTORE PERSISTENCE SYNC -----------------

export const saveEstateToFirestore = async (estate: Estate): Promise<void> => {
  try {
    const estateRef = doc(db, 'estates', estate.id);
    await setDoc(estateRef, estate, { merge: true });
  } catch (err) {
    console.warn('Firestore estate write warning (local fallback active):', err);
  }
};

export const saveJobToFirestore = async (job: LabourJob): Promise<void> => {
  try {
    const jobRef = doc(db, 'jobs', job.id);
    await setDoc(jobRef, job, { merge: true });
  } catch (err) {
    console.warn('Firestore job write warning (local fallback active):', err);
  }
};

export const subscribeToEstates = (onUpdate: (estates: Estate[]) => void) => {
  try {
    const colRef = collection(db, 'estates');
    return onSnapshot(colRef, (snapshot) => {
      const items: Estate[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Estate);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    }, (err) => {
      console.warn('Firestore estates listener warning:', err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to Firestore estates:', err);
    return () => {};
  }
};

export const subscribeToJobs = (onUpdate: (jobs: LabourJob[]) => void) => {
  try {
    const colRef = collection(db, 'jobs');
    return onSnapshot(colRef, (snapshot) => {
      const items: LabourJob[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as LabourJob);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    }, (err) => {
      console.warn('Firestore jobs listener warning:', err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to Firestore jobs:', err);
    return () => {};
  }
};

export const saveNicSubmissionToFirestore = async (submission: NicSubmission): Promise<void> => {
  try {
    const subRef = doc(db, 'nic_submissions', submission.id);
    await setDoc(subRef, submission, { merge: true });
  } catch (err) {
    console.warn('Firestore NIC submission write warning (local fallback active):', err);
  }
};

export const updateNicSubmissionInFirestore = async (id: string, updates: Partial<NicSubmission>): Promise<void> => {
  try {
    const subRef = doc(db, 'nic_submissions', id);
    await setDoc(subRef, updates, { merge: true });
  } catch (err) {
    console.warn('Firestore NIC submission update warning:', err);
  }
};

export const subscribeToNicSubmissions = (onUpdate: (submissions: NicSubmission[]) => void) => {
  try {
    const colRef = collection(db, 'nic_submissions');
    return onSnapshot(colRef, (snapshot) => {
      const items: NicSubmission[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as NicSubmission);
      });
      if (items.length > 0) {
        onUpdate(items);
      }
    }, (err) => {
      console.warn('Firestore NIC submissions listener warning:', err);
    });
  } catch (err) {
    console.warn('Failed to subscribe to Firestore NIC submissions:', err);
    return () => {};
  }
};

