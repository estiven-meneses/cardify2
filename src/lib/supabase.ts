import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * El backend es opcional. Mientras no existan las variables de entorno,
 * CardPDF funciona igual que siempre: todo en el cliente, sin nube.
 */
export const isBackendEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isBackendEnabled
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

/** Bucket privado. Nadie lee de aqui sin sesion: lo fuerzan las policies. */
export const PHOTOS_BUCKET = 'cardpdf-photos';
