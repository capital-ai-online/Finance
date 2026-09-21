import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  LockKeyhole,
  Search,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import {
  PUBLIC_FAQ_CATEGORIES,
  PUBLIC_FAQ_ITEMS,
  type PublicFaqCategory,
} from '../content/publicFaqContent';
import { LegalPageShell } from './LegalPageShell';

type FaqCategoryFilter = 'Alle' | PublicFaqCategory;

/**
 * Public FAQ presentation surface.
 *
 * CAPITAL-AI-FE owns only the presentation/composition. CAPITAL-AI-COMP owns the
 * visible FAQ/legal wording and may replace or extend it without transferring
 * content authority to Frontend.
 */
export function FaqPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategoryFilter>('Alle');
  const [openId, setOpenId] = useState<string>(PUBLIC_FAQ_ITEMS[0]?.id ?? '');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');

    return PUBLIC_FAQ_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      return [item.question, item.answer, item.category].some((value) =>
        value.toLocaleLowerCase('de-DE').includes(normalizedQuery),
      );
    });
  }, [query, selectedCategory]);

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
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            Antworten auf Basis der derzeit im CAPITAL-AI-Repository belegten Produkt-, Datenschutz-,
            Vertrags- und Sicherheitsinformationen. Nicht verifizierte Provider-, Lizenz-, Zertifizierungs-
            oder Leistungsbehauptungen werden hier nicht als Tatsachen dargestellt.
          </p>

          <div className="relative mt-5 max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <label htmlFor="public-faq-search" className="sr-only">
              FAQ durchsuchen
            </label>
            <input
              id="public-faq-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Frage oder Stichwort suchen …"
              className="min-h-11 w-full rounded-xl border border-white/10 bg-black/35 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="FAQ-Kategorien">
            {(['Alle', ...PUBLIC_FAQ_CATEGORIES] as FaqCategoryFilter[]).map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={active}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
                      : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 border-b border-white/10 p-6 sm:grid-cols-3 sm:p-8">
          <a
            href="/datenschutz"
            className="group rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.07]"
          >
            <LockKeyhole className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-3 text-sm font-bold text-white">Datenschutz & Rechte</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Verarbeitungstätigkeiten, Cookie-Einstellungen, Self-Service-Anfragen und Datenexport.
            </p>
          </a>

          <a
            href="/agb"
            className="group rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4 transition hover:border-amber-400/30 hover:bg-amber-400/[0.07]"
          >
            <FileText className="h-5 w-5 text-amber-300" />
            <h2 className="mt-3 text-sm font-bold text-white">AGB & Abonnement</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Nutzung, Stripe-Zahlungsabwicklung, Laufzeit, Kündigung und Verbraucherhinweise.
            </p>
          </a>

          <a
            href="/impressum"
            className="group rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] p-4 transition hover:border-violet-400/30 hover:bg-violet-400/[0.07]"
          >
            <Scale className="h-5 w-5 text-violet-300" />
            <h2 className="mt-3 text-sm font-bold text-white">Anbieter & Transparenz</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Anbieterkennzeichnung, Kontakt, Partner-/Referral-Hinweise und regulatorische Abgrenzung.
            </p>
          </a>
        </div>

        <div className="space-y-3 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <HelpCircle className="h-4 w-4 text-amber-300" />
                Fragen & Antworten
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {filteredItems.length} von {PUBLIC_FAQ_ITEMS.length} Einträgen sichtbar
              </p>
            </div>
            <a href="/login" className="text-xs font-semibold text-emerald-300 hover:underline">
              Zur Anmeldung
            </a>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-center">
              <p className="text-sm font-semibold text-white">Keine passende FAQ gefunden.</p>
              <p className="mt-1 text-xs text-slate-400">
                Suchbegriff oder Kategorie ändern. Für allgemeine Anfragen steht die Kontaktadresse im Impressum bereit.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const open = item.id === openId;
              const panelId = `faq-panel-${item.id}`;
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? '' : item.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.035] sm:px-5"
                  >
                    <span>
                      <span className="block text-[10px] font-mono uppercase tracking-[0.12em] text-amber-300/75">
                        {item.category}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-white">{item.question}</span>
                    </span>
                    {open ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>

                  {open && (
                    <div id={panelId} className="border-t border-white/10 px-4 py-4 sm:px-5">
                      <p className="text-sm leading-6 text-slate-300">{item.answer}</p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        <footer className="border-t border-white/10 px-6 py-4 text-center text-[10px] font-mono uppercase tracking-[0.16em] text-white/35 sm:px-8">
          Fachlicher Inhalt: CAPITAL-AI-COMP · Darstellung: CAPITAL-AI-FE · Keine ungeprüfte Übernahme von Musterdaten
        </footer>
      </section>
    </LegalPageShell>
  );
}
