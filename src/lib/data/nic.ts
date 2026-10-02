import { ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../firebase';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function extensionFor(file: File): string {
  return EXTENSION_BY_MIME[file.type] ?? file.name.split('.').pop() ?? 'jpg';
}

/**
 * CONTRACTS C5. Uploads to Storage at nic/{uid}/{side}.{ext} — readable by
 * the owner and admins only (storage.rules) — and returns that **path**,
 * not a download URL (closes KNOWN_ISSUES #8: no more base64 NIC images in
 * localStorage). The caller resolves a download URL from this path only
 * when actually displaying the image (e.g. the admin review screen), via
 * `getDownloadURL(ref(storage, path))`.
 */
export async function uploadNicImage(file: File, side: 'front' | 'back'): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Must be signed in to upload a NIC image');
  }

  const path = `nic/${uid}/${side}.${extensionFor(file)}`;
  await uploadBytes(ref(storage, path), file, { contentType: file.type || 'image/jpeg' });
  return path;
}
