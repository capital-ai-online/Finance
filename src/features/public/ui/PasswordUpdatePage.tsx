import React, { useState } from 'react';

interface PasswordUpdateResponse {
  error?: string;
}

async function readJson(response: Response): Promise<PasswordUpdateResponse> {
  try {
    return (await response.json()) as PasswordUpdateResponse;
  } catch {
    return {};
  }
}

export function PasswordUpdatePage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!password || password !== confirmation) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = await readJson(response);
        setError(body.error || 'Passwort konnte nicht geändert werden.');
        return;
      }

      window.location.replace('/login?password-updated=1');
    } catch {
      setError('Passwort konnte nicht geändert werden.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#02050e] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-2xl border border-amber-400/20 bg-[#090D1C] p-6 shadow-2xl">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
          CAPITAL-AI / ACCOUNT RECOVERY
        </p>
        <h1 className="mt-3 text-2xl font-black">Neues Passwort setzen</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Der Recovery-Link wurde serverseitig verifiziert. Lege jetzt dein neues Passwort fest.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-200">
            Neues Passwort
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-400/60"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-200">
            Passwort bestätigen
            <input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-400/60"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="min-h-11 w-full rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Wird gespeichert…' : 'Passwort speichern'}
          </button>
        </form>

        <a
          href="/login"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
        >
          Zurück zur Anmeldung
        </a>
      </section>
    </main>
  );
}
