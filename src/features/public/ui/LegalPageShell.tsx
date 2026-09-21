import type { ReactNode } from 'react';
import { ArrowLeft, FileText, HelpCircle, LockKeyhole, Scale } from 'lucide-react';
import { CapitalAiLogo } from '../../../shared/branding/CapitalAiLogo';

export type PublicLegalRoute = '/faq' | '/datenschutz' | '/agb' | '/impressum';

interface LegalPageShellProps {
  activeRoute: PublicLegalRoute;
  children: ReactNode;
}

const LEGAL_NAV: Array<{
  href: PublicLegalRoute;
  label: string;
  icon: typeof HelpCircle;
}> = [
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/datenschutz', label: 'Datenschutz', icon: LockKeyhole },
  { href: '/agb', label: 'AGB', icon: FileText },
  { href: '/impressum', label: 'Impressum', icon: Scale },
];

/**
 * Finance-owned visual adapter for the legal/FAQ surface.
 *
 * The graphical direction follows SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d.
 * This shell owns presentation and route navigation only. CAPITAL-AI-COMP remains the content owner
 * for the rendered legal and FAQ material.
 */
export function LegalPageShell({ activeRoute, children }: LegalPageShellProps) {
  return (
    <main
      id="main-content"
      role="main"
      data-design-source="SvenKulessa/FRONTEND"
      data-design-source-commit="f2a101330d74420c373f0ec56fa58caac53d741d"
      data-content-owner="CAPITAL-AI-COMP"
      className="relative min-h-screen overflow-hidden bg-[#02050e] px-4 py-6 text-slate-100 sm:px-6 sm:py-10"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-[#070b19]/85 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-aif-gold-DEFAULT" />
                Terminal
              </a>
              <CapitalAiLogo size={54} showText={true} />
            </div>

            <nav aria-label="Rechtliches und FAQ" className="flex gap-2 overflow-x-auto no-scrollbar">
              {LEGAL_NAV.map(({ href, label, icon: Icon }) => {
                const active = activeRoute === href;
                return (
                  <a
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-aif-gold-DEFAULT/40 bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">
            Design: CAPITAL-AI-FE · Fachlicher Inhalt: CAPITAL-AI-COMP
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
