import React from 'react';
import { FileText, HelpCircle, LockKeyhole, Scale, ShieldCheck } from 'lucide-react';
import { LegalPageShell } from './LegalPageShell';

/**
 * Public FAQ presentation surface.
 *
 * CAPITAL-AI-FE owns only the presentation/composition. CAPITAL-AI-COMP owns the
 * visible FAQ/legal wording and may replace or extend it without transferring
 * content authority to Frontend.
 */
export function FaqPage() {
  return (
    <LegalPageShell activeRoute="/faq">
      <section
        data-content-owner="CAPITAL-AI-COMP"
        data-design-source="SvenKulessa/FRONTEND"
        data-design-source-commit="f2a101330d74420c373f0ec56fa58caac53d741d"
        className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b19]/90 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl"
      >
        <div className="border-b border-white/10 bg-gradient-to-br from-amber-400/10 via-fuchsia-500/10 to-violet-600/15 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-mono text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Compliance-geführte Public Surface
          </div>
          <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">Häufig gestellte Fragen</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            Diese Route stellt die Design- und Navigationsoberfläche bereit. Fachliche Aussagen,
            rechtliche Hinweise, Versionen und Freigaben werden ausschließlich durch CAPITAL-AI-COMP
            gepflegt.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <a href="/datenschutz" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.05]">
            <LockKeyhole className="h-6 w-6 text-cyan-300" />
            <h2 className="mt-3 text-sm font-bold text-white">Datenschutz</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Compliance-geführte Datenschutzinformationen und Betroffenenrechte.</p>
          </a>

          <a href="/agb" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber-400/30 hover:bg-white/[0.05]">
            <FileText className="h-6 w-6 text-amber-300" />
            <h2 className="mt-3 text-sm font-bold text-white">AGB</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Compliance-geführte vertragliche Rahmenbedingungen.</p>
          </a>

          <a href="/impressum" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-400/30 hover:bg-white/[0.05]">
            <Scale className="h-6 w-6 text-violet-300" />
            <h2 className="mt-3 text-sm font-bold text-white">Impressum</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Compliance-geführte Anbieterkennzeichnung und Kontaktinformationen.</p>
          </a>

          <a href="/login" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/30 hover:bg-white/[0.05]">
            <HelpCircle className="h-6 w-6 text-emerald-300" />
            <h2 className="mt-3 text-sm font-bold text-white">Anmeldung & Konto</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Zur produktiven Login- und Registrierungsoberfläche.</p>
          </a>
        </div>

        <footer className="border-t border-white/10 px-6 py-4 text-center text-[10px] font-mono uppercase tracking-[0.16em] text-white/35 sm:px-8">
          Inhaltliche Pflege: CAPITAL-AI-COMP · Darstellung: CAPITAL-AI-FE
        </footer>
      </section>
    </LegalPageShell>
  );
}
