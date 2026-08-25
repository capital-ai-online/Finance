import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Languages,
  Search,
  ShieldCheck,
  Tags,
} from 'lucide-react';
import {
  createDefaultVocabularyRegistry,
  type VocabularyCategory,
  type VocabularyConcept,
} from '../../../platform/Vocabulary';

const CATEGORY_LABELS: Record<VocabularyCategory, string> = {
  asset: 'Assets',
  analytics: 'Analyse',
  architecture: 'Architektur',
  billing: 'Billing',
  compliance: 'Compliance',
  documentation: 'Dokumentation',
  iam: 'Identität & Zugriff',
  platform: 'Plattform',
  product: 'Produkt',
  release: 'Release',
};

const ALL_CATEGORIES = 'all' as const;
type CategoryFilter = typeof ALL_CATEGORIES | VocabularyCategory;

function searchableText(concept: VocabularyConcept): string {
  return [
    concept.id,
    concept.canonicalCodeTerm,
    concept.displayNameDE,
    concept.displayNameEN,
    concept.definitionDE,
    concept.definitionEN,
    ...concept.aliases,
  ]
    .join(' ')
    .toLocaleLowerCase('de-DE');
}

export function LearningVocabulary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);

  const approvedConcepts = useMemo(
    () =>
      createDefaultVocabularyRegistry()
        .list()
        .filter((concept) => concept.status === 'approved')
        .sort((a, b) => a.displayNameDE.localeCompare(b.displayNameDE, 'de')),
    [],
  );

  const categories = useMemo(
    () =>
      Array.from(new Set(approvedConcepts.map((concept) => concept.category))).sort((a, b) =>
        CATEGORY_LABELS[a].localeCompare(CATEGORY_LABELS[b], 'de'),
      ),
    [approvedConcepts],
  );

  const filteredConcepts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');

    return approvedConcepts.filter((concept) => {
      if (category !== ALL_CATEGORIES && concept.category !== category) return false;
      if (!normalizedQuery) return true;
      return searchableText(concept).includes(normalizedQuery);
    });
  }, [approvedConcepts, category, query]);

  return (
    <section className="space-y-6" aria-labelledby="learning-vocabulary-title">
      <header className="overflow-hidden rounded-2xl border border-brand-accent/30 bg-surface/80 backdrop-blur-xl">
        <div className="border-b border-border bg-gradient-to-r from-brand-accent/15 via-surface to-brand-primary/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-widest text-brand-accent">
                <BookOpen size={13} aria-hidden />
                Learning · Canonical Vocabulary
              </div>
              <div>
                <h1 id="learning-vocabulary-title" className="text-2xl font-black text-text-primary font-display sm:text-3xl">
                  CAPITAL-AI Vocabulary
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  Das freigegebene zweisprachige Begriffssystem von CAPITAL-AI – direkt aus der kanonischen Vocabulary Registry, ohne kopierte oder lokal neu definierte Begriffe.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <div className="rounded-xl border border-border bg-canvas/60 p-3">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  <CheckCircle2 size={12} className="text-brand-success" aria-hidden />
                  Freigegeben
                </div>
                <div className="mt-1 text-xl font-black text-text-primary">{approvedConcepts.length}</div>
              </div>
              <div className="rounded-xl border border-border bg-canvas/60 p-3">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  <Tags size={12} className="text-brand-cyan" aria-hidden />
                  Kategorien
                </div>
                <div className="mt-1 text-xl font-black text-text-primary">{categories.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.35fr)]">
          <label className="relative block">
            <span className="sr-only">Vocabulary durchsuchen</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Begriff, Definition, Alias oder Concept-ID suchen …"
              className="w-full rounded-xl border border-border bg-canvas/70 py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20 placeholder:text-text-muted"
            />
          </label>

          <label className="block">
            <span className="sr-only">Vocabulary-Kategorie filtern</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="w-full rounded-xl border border-border bg-canvas/70 px-3 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value={ALL_CATEGORIES}>Alle Kategorien</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 text-xs leading-relaxed text-text-secondary">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden />
        <p>
          <strong className="text-text-primary">Read-only Lernprojektion.</strong> Die Vocabulary Registry besitzt keine Finanz-, Scoring-, Ranking-, Eligibility-, IAM-, Billing-, Release- oder Produktions-Mutationsauthority. Fachliche Entscheidungen bleiben in ihren bestehenden kanonischen Systemen.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-mono text-text-muted" aria-live="polite">
          {filteredConcepts.length} von {approvedConcepts.length} freigegebenen Begriffen
        </p>
        {(query || category !== ALL_CATEGORIES) && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory(ALL_CATEGORIES);
            }}
            className="self-start rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-text-secondary transition hover:border-brand-primary/40 hover:text-text-primary"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {filteredConcepts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredConcepts.map((concept) => (
            <article key={concept.id} className="rounded-2xl border border-border bg-surface/75 p-5 shadow-sm backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider text-brand-cyan">
                      {CATEGORY_LABELS[concept.category]}
                    </span>
                    <span className="rounded-full border border-brand-success/20 bg-brand-success/10 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider text-brand-success">
                      Freigegeben · v{concept.version}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-text-primary font-display">{concept.displayNameDE}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                    <Languages size={13} aria-hidden />
                    <span>{concept.displayNameEN}</span>
                  </div>
                </div>

                <div className="shrink-0 rounded-lg border border-border bg-canvas/60 px-2.5 py-1.5 text-[10px] font-mono text-text-muted" title="Stabile Concept-ID">
                  {concept.id}
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-brand-primary">
                    <BookOpen size={12} aria-hidden />
                    Definition · DE
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">{concept.definitionDE}</p>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-brand-accent">
                    <Languages size={12} aria-hidden />
                    Definition · EN
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">{concept.definitionEN}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-text-muted">
                    <Code2 size={12} aria-hidden />
                    Canonical Code Term
                  </div>
                  <code className="mt-1 block break-all text-xs font-bold text-brand-primary">{concept.canonicalCodeTerm}</code>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-text-muted">
                    <Tags size={12} aria-hidden />
                    Aliase
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {concept.aliases.length > 0 ? concept.aliases.join(', ') : 'Keine freigegebenen Aliase'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4" aria-label="Governance-Referenzen">
                {[...concept.essReferences, ...concept.adrReferences, ...concept.traceabilityReferences].map((reference) => (
                  <span
                    key={`${concept.id}-${reference}`}
                    className="rounded border border-border bg-canvas/60 px-2 py-0.5 text-[9px] font-mono text-text-muted"
                  >
                    {reference}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <Search size={28} className="mx-auto text-text-muted" aria-hidden />
          <h2 className="mt-3 text-base font-black text-text-primary">Kein Vocabulary-Eintrag gefunden</h2>
          <p className="mt-1 text-sm text-text-secondary">Passe Suchbegriff oder Kategorie an.</p>
        </div>
      )}
    </section>
  );
}

export default LearningVocabulary;
