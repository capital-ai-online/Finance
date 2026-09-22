import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Coins,
  Copy,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  X,
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

const ALL_CATEGORIES = 'all' as const;
type CategoryFilter = typeof ALL_CATEGORIES | VocabularyCategory;

interface LearningVocabularyProps {
  onClose?: () => void;
}

function isVocabularyCategory(value: string): value is VocabularyCategory {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value);
}

function parseCategoryFilter(value: string): CategoryFilter {
  if (value === ALL_CATEGORIES) return ALL_CATEGORIES;
  return isVocabularyCategory(value) ? value : ALL_CATEGORIES;
}

function categoryIcon(category: VocabularyCategory) {
  switch (category) {
    case 'asset':
    case 'analytics':
      return <TrendingUp className="h-3.5 w-3.5 text-amber-400" aria-hidden />;
    case 'ai-development-chat-execution':
      return <Brain className="h-3.5 w-3.5 text-[#8D26FF]" aria-hidden />;
    case 'billing':
      return <Coins className="h-3.5 w-3.5 text-emerald-400" aria-hidden />;
    case 'compliance':
    case 'iam':
      return <ShieldCheck className="h-3.5 w-3.5 text-amber-300" aria-hidden />;
    case 'architecture':
    case 'platform':
    case 'release':
      return <Layers className="h-3.5 w-3.5 text-blue-400" aria-hidden />;
    default:
      return <BookOpen className="h-3.5 w-3.5 text-amber-400" aria-hidden />;
  }
}

function thesaurusTerms(concept: VocabularyConcept): string[] {
  const primary = normalizeVocabularyTerm(concept.displayNameDE);
  const seen = new Set<string>();

  return [concept.displayNameEN, concept.canonicalCodeTerm, ...concept.aliases].filter((value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const normalized = normalizeVocabularyTerm(trimmed);
    if (!normalized || normalized === primary || seen.has(normalized)) return false;

    seen.add(normalized);
    return true;
  });
}

function searchableText(concept: VocabularyConcept): string {
  return normalizeVocabularyTerm([
    concept.id,
    concept.displayNameDE,
    concept.displayNameEN,
    concept.canonicalCodeTerm,
    concept.definitionDE,
    concept.definitionEN,
    ...thesaurusTerms(concept),
  ].join(' '));
}

export function LearningVocabulary({ onClose }: LearningVocabularyProps = {}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [expandedConceptId, setExpandedConceptId] = useState<string | null>(null);
  const [copiedConceptId, setCopiedConceptId] = useState<string | null>(null);

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

  const copyConcept = async (concept: VocabularyConcept, event: React.MouseEvent) => {
    event.stopPropagation();
    const thesaurus = thesaurusTerms(concept);
    const text = [
      concept.displayNameDE,
      `Definition:\n${concept.definitionDE}`,
      `Englisch:\n${concept.displayNameEN} — ${concept.definitionEN}`,
      `Thesaurus:\n${thesaurus.length > 0 ? thesaurus.join(', ') : 'Keine weiteren Begriffe'}`,
      `Canonical Code Term:\n${concept.canonicalCodeTerm}`,
    ].join('\n\n');

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      setCopiedConceptId(concept.id);
      window.setTimeout(() => setCopiedConceptId(null), 2000);
    }
  };

  return (
    <section
      className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-[#070d1e] text-slate-100 shadow-[0_0_50px_rgba(249,191,33,0.15)] sm:rounded-3xl"
      aria-labelledby="learning-vocabulary-title"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-[#8D26FF]/10 to-transparent px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-[0_0_15px_rgba(249,191,33,0.25)]">
            <BookOpen className="h-5 w-5 stroke-[2.2]" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Market Vocabulary Module
              </span>
              <span className="rounded border border-[#8D26FF]/40 bg-[#8D26FF]/20 px-1.5 py-0.5 text-[9.5px] font-bold text-purple-300">
                {approvedConcepts.length} Begriffe
              </span>
            </div>
            <h1
              id="learning-vocabulary-title"
              className="truncate text-lg font-extrabold tracking-tight text-white sm:text-xl"
            >
              Finanz- & Quant-Glossar
            </h1>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:bg-white/15"
            aria-label="Glossar schließen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="shrink-0 space-y-3 border-b border-slate-800/80 bg-[#040816]/90 p-4 sm:px-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Begriff, Alias, Thesaurus oder Thema suchen …"
            className="w-full rounded-xl border border-slate-700/80 bg-[#091124] py-2.5 pl-10 pr-9 text-xs text-slate-100 outline-none transition-all placeholder:text-slate-500 hover:border-amber-400/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label="Suche zurücksetzen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Vocabulary-Kategorien">
          <button
            type="button"
            onClick={() => setCategory(ALL_CATEGORIES)}
            aria-pressed={category === ALL_CATEGORIES}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              category === ALL_CATEGORIES
                ? 'border-amber-300 bg-amber-400 font-bold text-black shadow-[0_0_12px_rgba(249,191,33,0.3)]'
                : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            <span>Alle</span>
            <span className={`rounded-full px-1.5 font-mono text-[10px] ${category === ALL_CATEGORIES ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'}`}>
              {approvedConcepts.length}
            </span>
          </button>

          {categories.map((item) => {
            const selected = category === item;
            const count = approvedConcepts.filter((concept) => concept.category === item).length;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={selected}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  selected
                    ? 'border-amber-300 bg-amber-400 font-bold text-black shadow-[0_0_12px_rgba(249,191,33,0.3)]'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {categoryIcon(item)}
                <span>{CATEGORY_LABELS[item]}</span>
                <span className={`rounded-full px-1.5 font-mono text-[10px] ${selected ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-[64vh] flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="font-mono">{filteredConcepts.length} von {approvedConcepts.length} Begriffen</span>
          {(query || category !== ALL_CATEGORIES) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory(ALL_CATEGORIES);
              }}
              className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>

        {filteredConcepts.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" aria-hidden />
            <h2 className="text-sm font-bold text-slate-300">Keine passenden Fachbegriffe gefunden</h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Suche nach einem anderen Begriff, Alias oder Thesaurus-Eintrag.
            </p>
          </div>
        ) : (
          filteredConcepts.map((concept) => {
            const expanded = expandedConceptId === concept.id;
            const copied = copiedConceptId === concept.id;
            const thesaurus = thesaurusTerms(concept);

            return (
              <article
                key={concept.id}
                className={`rounded-2xl border transition-all ${
                  expanded
                    ? 'border-amber-500/30 bg-gradient-to-b from-[#091228] to-[#060c1d] p-4 shadow-[0_0_20px_rgba(249,191,33,0.08)]'
                    : 'border-transparent p-3 hover:bg-white/[0.02]'
                }`}
              >
                <div
                  onClick={() => setExpandedConceptId(expanded ? null : concept.id)}
                  className="flex cursor-pointer select-none items-start justify-between gap-3"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setExpandedConceptId(expanded ? null : concept.id);
                    }
                  }}
                  aria-expanded={expanded}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-300">
                        {categoryIcon(concept.category)}
                        <span>{CATEGORY_LABELS[concept.category]}</span>
                      </span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-emerald-400">
                        Freigegeben
                      </span>
                      {concept.displayNameEN && (
                        <span className="font-mono text-[10px] font-semibold text-amber-400/90">
                          • {concept.displayNameEN}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-white sm:text-lg">{concept.displayNameDE}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
                      {concept.definitionDE}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(event) => void copyConcept(concept, event)}
                      className="rounded-lg bg-white/5 p-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-amber-300"
                      title="Definition und Thesaurus kopieren"
                      aria-label="Definition und Thesaurus kopieren"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                      {expanded ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 space-y-3 border-t border-slate-800/80 pt-3">
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        <Sparkles className="h-3 w-3 text-amber-400" aria-hidden />
                        <span>Definition · Englisch</span>
                      </div>
                      <p className="rounded-xl border border-slate-800/90 bg-[#040815]/60 p-3 text-xs font-normal leading-relaxed text-slate-300">
                        {concept.definitionEN}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                      <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                        <Code2 className="h-3 w-3" aria-hidden />
                        Canonical Code Term
                      </div>
                      <code className="text-xs font-semibold text-amber-200">{concept.canonicalCodeTerm}</code>
                    </div>

                    <div className="rounded-xl border border-slate-700/60 bg-[#091224] p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#44DE88]">
                        <Tags className="h-3 w-3" aria-hidden />
                        Thesaurus
                      </div>
                      {thesaurus.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {thesaurus.map((term) => (
                            <span
                              key={`${concept.id}-thesaurus-${term}`}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10.5px] font-semibold text-slate-300"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Keine weiteren freigegebenen Begriffe.</p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default LearningVocabulary;
