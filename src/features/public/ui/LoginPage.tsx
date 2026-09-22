import React, { useMemo } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from './frontend-port/components/BrandLogo';

interface LoginPageProps {
  justLoggedOut?: boolean;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  callback_verification_failed: 'Die Google-Rückmeldung konnte nicht verifiziert werden.',
  code_exchange_failed: 'Die Google-Sitzung konnte nicht sicher übernommen werden.',
  callback_failed: 'Die Anmeldung konnte nicht abgeschlossen werden.',
};

/**
 * OPS-AUTH-BACKEND-01 login presentation.
 *
 * This page contains no Supabase client, password flow, registration, recovery, secondary-factor
 * or OAuth callback logic. The only productive entrypoint is the backend-owned Google OAuth endpoint.
 */
export function LoginPage({ justLoggedOut = false }: LoginPageProps) {
  const authError = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const code = new URLSearchParams(window.location.search).get('auth_error');
    if (!code) return null;
    return AUTH_ERROR_MESSAGES[code] ?? 'Die Anmeldung konnte nicht abgeschlossen werden.';
  }, []);

  return (
    <main
      role="main"
      id="main-content"
      data-auth-architecture="backend-first"
      className="relative flex min-h-screen w-full select-none flex-col items-center justify-start overflow-hidden bg-[#02050e] p-4 pb-16 text-slate-100 sm:p-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-40 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col">
        <div className="flex items-center justify-between pb-4 pt-2">
          <a
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-aif-gold-DEFAULT" />
            <span>Zurück zur Übersicht</span>
          </a>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Backend Session</span>
          </div>
        </div>

        <section className="mb-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-400/10 via-fuchsia-500/10 to-violet-600/15 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-lg border border-amber-400/30 bg-amber-400/15 p-1.5 text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              CAPITAL-AI Zugang
            </span>
          </div>
          <h1 className="text-lg font-extrabold leading-snug tracking-tight text-white">
            Anmeldung neu aufgebaut
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Google-Anmeldung, Session-Aufbau und Abo-Zuordnung werden vollständig im Backend
            verarbeitet. Der Browser speichert keine Supabase-Zugangstokens.
          </p>
        </section>

        <section className="rounded-3xl border border-amber-500/25 bg-[#070b19]/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(249,191,33,0.12)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandLogo variant="stacked" size="lg" />
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Terminal Anmeldung</h2>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              Eine Anmeldung. Ein Backend-Sessionpfad. Keine clientseitige Auth-Orchestrierung.
            </p>
          </div>

          {justLoggedOut && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={15} />
              Erfolgreich abgemeldet.
            </div>
          )}

          {authError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <a
            id="backend-google-login"
            href="/api/auth/login/google?next=%2F"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label="Mit Google anmelden"
          >
            <LogIn size={17} />
            <span>Mit Google anmelden</span>
          </a>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-3 text-[11px] leading-relaxed text-slate-400">
            Nach erfolgreicher Google-Anmeldung setzt das Backend eine geschützte HttpOnly-Session
            und leitet direkt zur Anwendung zurück.
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-slate-500">
            <a href="/datenschutz" className="hover:text-slate-300">Datenschutz</a>
            <a href="/impressum" className="hover:text-slate-300">Impressum</a>
            <a href="/agb" className="hover:text-slate-300">AGB</a>
          </div>
        </section>
      </div>
    </main>
  );
}
