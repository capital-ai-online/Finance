import React from 'react';
import { ArrowLeft, FileText, HelpCircle, LockKeyhole, Scale, ShieldCheck } from 'lucide-react';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';

/**
 * Public FAQ presentation surface.
 *
 * CAPITAL-AI-FE owns only this presentation/composition. CAPITAL-AI-COMP owns the
 * legal/compliance content and may replace or extend the visible FAQ copy without
 * transferring that authority to Frontend.
 */
export function FaqPage() {
  return (
    <main
      id="main-content"
      role="main"
      data-content-owner="CAPITAL-AI-COMP"
      data-design-source="SvenKulessa/FRONTEND"
      data-design-source-commit="64a0c24bd60501611aef10d36c61f71eba81f752"
      className="relative min-h-screen overflow-hidden bg-[#02050e] px-4 py-8 text-slate-100 sm:px-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/"
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-aif-gold-DEFAULT" />
            Zurück zur Übersicht
          </a>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-mono text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance-geführte Public Surface
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b19]/90 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="border-b border-white/10 bg-gradient-to-br from-amber-400/10 via-fuchsia-500/10 to-violet-600/15 p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-4">
              <CapitalAiLogo size={76} showText={true} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  Rechtliches & Hilfe
                </p>
                <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                  Häufig gestellte Fragen
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Diese produktive FAQ-Route stellt die öffentliche Oberfläche für von
              <strong className="font-semibold text-white"> CAPITAL-AI-COMP </strong>
              gepflegte Inhalte bereit. Frontend definiert dabei keine rechtlichen Aussagen,
              Einwilligungen oder Compliance-Entscheidungen.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <a href="/datenschutz" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.05]">
              <LockKeyhole className="h-6 w-6 text-cyan-300" />
              <h2 className="mt-3 text-sm font-bold text-white">Datenschutz</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Informationen zur Verarbeitung personenbezogener Daten und zu Datenschutzrechten.
              </p>
            </a>

            <a href="/agb" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-400/30 hover:bg-white/[0.05]">
              <FileText className="h-6 w-6 text-amber-300" />
              <h2 className="mt-3 text-sm font-bold text-white">AGB</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Vertragliche Rahmenbedingungen für die Nutzung der angebotenen Funktionen.
              </p>
            </a>

            <a href="/impressum" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-400/30 hover:bg-white/[0.05]">
              <Scale className="h-6 w-6 text-violet-300" />
              <h2 className="mt-3 text-sm font-bold text-white">Impressum</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Anbieterkennzeichnung und Kontaktinformationen der öffentlichen Webanwendung.
              </p>
            </a>

            <a href="/login" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/30 hover:bg-white/[0.05]">
              <HelpCircle className="h-6 w-6 text-emerald-300" />
              <h2 className="mt-3 text-sm font-bold text-white">Anmeldung & Konto</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Zur sicheren Login- und Registrierungsoberfläche der Capital-AI Anwendung.
              </p>
            </a>
          </div>

          <footer className="border-t border-white/10 px-6 py-4 text-center text-[10px] font-mono uppercase tracking-[0.16em] text-white/35 sm:px-8">
            Inhaltliche Pflege: CAPITAL-AI-COMP · Darstellung: CAPITAL-AI-FE
          </footer>
        </section>
      </div>
    </main>
  );
}
