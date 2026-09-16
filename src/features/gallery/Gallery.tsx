import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { listPhotos, signedUrl, deletePhoto, type StoredPhoto } from './storage';

type Item = StoredPhoto & { url: string | null };

export function Gallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const photos = await listPhotos();
      const withUrls = await Promise.all(
        photos.map(async (photo) => ({
          ...photo,
          url: await signedUrl(photo.path).catch(() => null)
        }))
      );
      setItems(withUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las fotos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onDelete(path: string) {
    try {
      await deletePhoto(path);
      setItems((prev) => prev.filter((item) => item.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo borrar.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Tus fotos</span>
        <button
          type="button"
          onClick={() => void supabase?.auth.signOut()}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Salir
        </button>
      </div>

      {loading && <p className="text-xs text-slate-500">Cargando...</p>}
      {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-slate-500">Todavia no has guardado ninguna.</p>
      )}

      <ul className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <li
            key={item.path}
            className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {item.url ? (
              <img src={item.url} alt={item.name} loading="lazy" className="h-20 w-full object-cover" />
            ) : (
              <div className="h-20 w-full bg-slate-100 dark:bg-slate-800" />
            )}
            <button
              type="button"
              onClick={() => void onDelete(item.path)}
              aria-label={`Borrar ${item.name}`}
              className="absolute right-1 top-1 rounded bg-black/60 p-1 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
