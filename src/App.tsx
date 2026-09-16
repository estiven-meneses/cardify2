import { isBackendEnabled } from './lib/supabase';
import { useSession } from './features/auth/useSession';
import { AuthGate } from './features/auth/AuthGate';
import { Gallery } from './features/gallery/Gallery';

/**
 * Superficie nueva en React. Convive con el lienzo heredado sin tocarlo:
 * si no hay backend configurado no se pinta nada y la app sigue igual.
 */
export function App() {
  const { session, loading } = useSession();

  if (!isBackendEnabled || loading) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      {session ? <Gallery /> : <AuthGate />}
    </section>
  );
}
