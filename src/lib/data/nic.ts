import { getAuthUserId, supabase } from '../supabase';

/** Private Storage bucket for NIC photos (supabase/migrations/*_storage.sql). */
export const NIC_BUCKET = 'nic';

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
 * CONTRACTS C5. Uploads to the private `nic` bucket at `{uid}/{side}.{ext}`
 * (readable by the owner and admins only) and returns that **path**, not a
 * URL (closes KNOWN_ISSUES #8: no base64 NIC images in localStorage).
 * Re-uploading a side replaces it. Resolve a URL only when displaying the
 * image, with `getNicImageUrl(path)`.
 */
export async function uploadNicImage(file: File, side: 'front' | 'back'): Promise<string> {
  const uid = getAuthUserId();
  if (!uid) {
    throw new Error('Must be signed in to upload a NIC image');
  }

  const path = `${uid}/${side}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(NIC_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

/** A short-lived signed URL for a path from uploadNicImage (the owner or an admin only; RLS on storage.objects). */
export async function getNicImageUrl(path: string, expiresInSeconds = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(NIC_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
