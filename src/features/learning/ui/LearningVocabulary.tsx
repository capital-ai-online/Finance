import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Languages,
  Orbit,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
} from 'lucide-react';
import {
  createDefaultVocabularyRegistry,
  normalizeVocabularyTerm,
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
  'ai-development-chat-execution': 'AI Development & Execution',
};

const CATEGORY_TONES: Record<VocabularyCategory, string> = {
  asset: 'border-asset-crypto/25 bg-asset-crypto/[0.07] text-asset-crypto',
  analytics: 'border-factor-technical/25 bg-factor-technical/[0.07] text-factor-technical',
  architecture: 'border-brand-cyan/25 bg-brand-cyan/[0.06] text-brand-cyan',
  billing: 'border-brand-primary/25 bg-brand-primary/[0.07] text-brand-primary',
  compliance: 'border-brand-success/25 bg-brand-success/[0.07] text-brand-success',
  documentation: 'border-text-secondary/20 bg-surface/70 text-text-secondary',
  iam: 'border-status-warning/25 bg-status-warning/[0.07] text-status-warning',
  platform: 'border-brand-accent/25 bg-brand-accent/[0.07] text-brand-accent',
  product: 'border-score-ranking/25 bg-score-ranking/[0.07] text-score-ranking',
  release: 'border-status-info/25 bg-status-info/[0.07] text-status-info',
  'ai-development-chat-execution': 'border-status-ai/25 bg-status-ai/[0.07] text-status-ai',
};

const ALL_CATEGORIES = 'all' as const;
type CategoryFilter = typeof ALL_CATEGORIES | VocabularyCategory;

function isVocabularyCategory(value: string): value is VocabularyCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value);
}

function parseCategoryFilter(value: string): CategoryFilter {
  if (value === ALL_CATEGORIES) return ALL_CATEGORIES;
  return isVocabularyCategory(value) ? value : ALL_CATEGORIES;
}

function searchableText(concept: VocabularyConcept): string {
  return normalizeVocabularyTerm([
    concept.id,
    concept.canonicalCodeTerm,
    concept.displayNameDE,
    concept.displayNameEN,
    concept.definitionDE,
    concept.definitionEN,
    ...concept.aliases,
  ].join(' '));
}

function governanceReferences(concept: VocabularyConcept): string[] {
  return Array.from(new Set([
    ...concept.essReferences,
    ...concept.adrReferences,
    ...concept.traceabilityReferences,
  ])).sort();
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
    const normalizedQuery = normalizeVocabularyTerm(query);

    return approvedConcepts.filter((concept) => {
      if (category !== ALL_CATEGORIES && concept.category !== category) return false;
      if (!normalizedQuery) return true;
      return searchableText(concept).includes(normalizedQuery);
    });
  }, [approvedConcepts, category, query]);

  return (
    <section className="relative space-y-6 overflow-hidden" aria-labelledby="learning-vocabulary-title">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] overflow-hidden" aria-hidden="true">
        <div className="absolute left-[8%] top-10 h-64 w-64 rounded-full border border-brand-primary/10 bg-brand-primary/[0.035] blur-[1px]" />
        <div className="absolute right-[6%] top-20 h-72 w-72 rounded-full border border-brand-accent/10 bg-brand-accent/[0.035] blur-[1px]" />
        <div className="absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-primary/35 to-transparent" />
      </div>

      <header className="ui-panel-elevated overflow-hidden border-brand-primary/25">
        <div className="relative border-b border-border bg-gradient-to-br from-brand-primary/[0.10] via-background/80 to-brand-accent/[0.08] p-6 sm:p-8">
          <div className="pointer-events-none absolute right-5 top-5 opacity-20" aria-hidden="true">
            <Orbit size={132} className="text-brand-primary" strokeWidth={0.7} />
          </div>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-primary">
                  <Orbit size={13} aria-hidden />
                  Universe Knowledge Grid
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/25 bg-brand-accent/[0.07] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent">
                  <Sparkles size={12} aria-hidden /> Canonical Vocabulary
                </span>
              </div>
              <div>
                <h1 id="learning-vocabulary-title" className="font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                  CAPITAL-AI Vocabulary Universe
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
                  Begriffe, Architektur- und Plattformkonzepte als navigierbare Knowledge-Nodes – direkt aus der kanonischen Registry. Keine kopierte Begriffswelt und keine zweite fachliche Authority.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <div className="rounded-2xl border border-brand-success/20 bg-background/55 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                  <CheckCircle2 size={13} className="text-brand-success" aria-hidden />
                  Freigegeben
                </div>
                <div className="mt-2 font-display text-3xl font-black text-text-primary">{approvedConcepts.length}</div>
              </div>
              <div className="rounded-2xl border border-brand-accent/20 bg-background/55 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                  <Tags size={13} className="text-brand-accent" aria-hidden />
                  Universen
                </div>
                <div className="mt-2 font-display text-3xl font-black text-text-primary">{categories.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Vocabulary-Universen">
            <button
              type="button"
              onClick={() => setCategory(ALL_CATEGORIES)}
              aria-pressed={category === ALL_CATEGORIES}
              className={`ui-hit shrink-0 rounded-xl border px-3 py-2 text-[10px] font-mono font-black uppercase tracking-wider transition ${category === ALL_CATEGORIES ? 'border-brand-primary/40 bg-brand-primary/12 text-brand-primary' : 'border-border bg-background/45 text-text-secondary hover:border-brand-primary/30 hover:text-text-primary'}`}
            >
              Alle Universen
            </button>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`ui-hit shrink-0 rounded-xl border px-3 py-2 text-[10px] font-mono font-black uppercase tracking-wider transition ${category === item ? CATEGORY_TONES[item] : 'border-border bg-background/45 text-text-secondary hover:border-white/15 hover:text-text-primary'}`}
              >
                {CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.35fr)]">
            <label className="relative block">
              <span className="sr-only">Vocabulary durchsuchen</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Knowledge-Node, Definition, Alias oder Concept-ID suchen …"
                className="min-h-11 w-full rounded-xl border border-border bg-background/65 py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20 placeholder:text-text-secondary/60"
              />
            </label>

            <label className="block">
              <span className="sr-only">Vocabulary-Kategorie filtern</span>
              <select
                value={category}
                onChange={(event) => setCategory(parseCategoryFilter(event.target.value))}
                className="min-h-11 w-full rounded-xl border border-border bg-background/65 px-3 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value={ALL_CATEGORIES}>Alle Kategorien</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-primary/20 bg-brand-primary/[0.045] p-4 text-xs leading-relaxed text-text-secondary backdrop-blur-md">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden />
        <p>
          <strong className="text-text-primary">Read-only Knowledge Projection.</strong> Die Vocabulary Registry besitzt keine Finanz-, Scoring-, Ranking-, Eligibility-, IAM-, Billing-, Release- oder Produktions-Mutationsauthority. Fachliche Entscheidungen bleiben in ihren bestehenden kanonischen Systemen.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-mono text-text-secondary" aria-live="polite">
          {filteredConcepts.length} von {approvedConcepts.length} freigegebenen Knowledge-Nodes
        </p>
        {(query || category !== ALL_CATEGORIES) && (
          <button
            type="button"
            onClick={() => { setQuery(''); setCategory(ALL_CATEGORIES); }}
            className="ui-hit self-start rounded-xl border border-border bg-surface/60 px-3 py-2 text-[11px] font-bold text-text-secondary transition hover:border-brand-primary/40 hover:text-text-primary"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {filteredConcepts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredConcepts.map((concept) => (
            <article key={concept.id} className="group relative overflow-hidden rounded-2xl border border-border bg-surface/55 p-5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-brand-primary/25 hover:bg-surface/70">
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/35 to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider ${CATEGORY_TONES[concept.category]}`}>
                      {CATEGORY_LABELS[concept.category]}
                    </span>
                    <span className="rounded-full border border-brand-success/20 bg-brand-success/10 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider text-brand-success">
                      Freigegeben · v{concept.version}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-black text-text-primary">{concept.displayNameDE}</h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                    <Languages size={13} aria-hidden />
                    <span>{concept.displayNameEN}</span>
                  </div>
                </div>
                <div className="shrink-0 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-[10px] font-mono text-text-secondary" title="Stabile Concept-ID">
                  {concept.id}
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/35 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-brand-primary">
                    <BookOpen size={12} aria-hidden /> Definition · DE
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">{concept.definitionDE}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/35 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-brand-accent">
                    <Languages size={12} aria-hidden /> Definition · EN
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary">{concept.definitionEN}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-text-secondary"><Code2 size={12} aria-hidden />Canonical Code Term</div>
                  <code className="mt-1 block break-all text-xs font-bold text-brand-primary">{concept.canonicalCodeTerm}</code>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-text-secondary"><Tags size={12} aria-hidden />Aliase</div>
                  <p className="mt-1 text-xs text-text-secondary">{concept.aliases.length > 0 ? concept.aliases.join(', ') : 'Keine freigegebenen Aliase'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4" aria-label="Governance-Referenzen">
                {governanceReferences(concept).map((reference) => (
                  <span key={`${concept.id}-${reference}`} className="rounded border border-border bg-background/60 px-2 py-0.5 text-[9px] font-mono text-text-secondary">{reference}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <Search size={28} className="mx-auto text-brand-primary" aria-hidden />
          <h2 className="mt-3 font-display text-base font-black text-text-primary">Kein Knowledge-Node gefunden</h2>
          <p className="mt-1 text-sm text-text-secondary">Passe Suchbegriff oder Universe-Filter an.</p>
        </div>
      )}
    </section>
  );
}

export default LearningVocabulary;