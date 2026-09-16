import { supabase, PHOTOS_BUCKET } from '../../lib/supabase';

export type StoredPhoto = {
  /** Ruta completa dentro del bucket: `${userId}/${nombre}`. */
  path: string;
  name: string;
  createdAt: string | null;
  sizeBytes: number | null;
};

function requireClient() {
  if (!supabase) throw new Error('Supabase no esta configurado.');
  return supabase;
}

async function requireUserId(): Promise<string> {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('No hay sesion.');
  return data.user.id;
}

/**
 * Sube una foto al bucket privado, siempre bajo la carpeta del usuario.
 * El prefijo `${userId}/` no es cosmetico: es lo que evalua la policy de RLS.
 */
export async function uploadPhoto(file: File | Blob, filename: string): Promise<string> {
  const client = requireClient();
  const userId = await requireUserId();
  const safe = filename.replace(/[^\w.\-]/g, '_');
  const path = `${userId}/${Date.now()}-${safe}`;

  const { error } = await client.storage.from(PHOTOS_BUCKET).upload(path, file, {
    contentType: file instanceof File ? file.type || 'image/jpeg' : 'image/jpeg',
    upsert: false
  });
  if (error) throw error;
  return path;
}

export async function listPhotos(): Promise<StoredPhoto[]> {
  const client = requireClient();
  const userId = await requireUserId();

  const { data, error } = await client.storage.from(PHOTOS_BUCKET).list(userId, {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' }
  });
  if (error) throw error;

  return (data ?? [])
    .filter((item) => item.id !== null)
    .map((item) => ({
      path: `${userId}/${item.name}`,
      name: item.name,
      createdAt: item.created_at ?? null,
      sizeBytes: (item.metadata?.size as number | undefined) ?? null
    }));
}

/**
 * El bucket es privado, asi que no hay URL publica: se firma una temporal.
 * Una hora alcanza para mirarlas y evita repartir enlaces eternos.
 */
export async function signedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const client = requireClient();
  const { data, error } = await client.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deletePhoto(path: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.storage.from(PHOTOS_BUCKET).remove([path]);
  if (error) throw error;
}
