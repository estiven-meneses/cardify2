import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Enlace magico por correo: no hay contrasena que guardar ni que perder.
 * CardPDF es de un solo dueno, asi que el registro abierto se cierra desde
 * el panel de Supabase (Authentication > Sign Ups).
 */
export function AuthGate() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin }
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }
    setStatus('sent');
    setMessage('Revisa tu correo y abre el enlace para entrar.');
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
      <label htmlFor="cardpdf-email" className="text-xs font-bold text-slate-600 dark:text-slate-300">
        Entra para ver tus fotos guardadas
      </label>
      <input
        id="cardpdf-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {status === 'sending' ? 'Enviando...' : 'Enviar enlace'}
      </button>
      {message && (
        <p
          className={
            status === 'error'
              ? 'text-xs font-semibold text-rose-600 dark:text-rose-400'
              : 'text-xs font-semibold text-emerald-600 dark:text-emerald-400'
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
