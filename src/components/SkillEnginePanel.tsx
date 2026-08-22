import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Copy,
  Cpu,
  GitBranch,
  ListChecks,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  buildVocabularyInventory,
  compileSkillPrompt,
  errorClasses,
  skillCatalog,
  validateSkillCatalog,
  type VerificationPriority,
} from '../platform/Quality/SkillEngine';

type SkillEngineTab = 'registry' | 'errors' | 'vocabulary' | 'priorities' | 'prompt';

const priorityOrder: VerificationPriority[] = ['P0', 'P1', 'P2', 'P3'];

const priorityClass: Record<VerificationPriority, string> = {
  P0: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
  P1: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
  P2: 'border-sky-500/35 bg-sky-500/10 text-sky-300',
  P3: 'border-white/10 bg-white/5 text-white/60',
};

export function SkillEnginePanel() {
  const [activeTab, setActiveTab] = useState<SkillEngineTab>('registry');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState(skillCatalog[0]?.id ?? '');
  const [copied, setCopied] = useState(false);

  const validationFindings = useMemo(() => validateSkillCatalog(skillCatalog), []);
  const vocabularyInventory = useMemo(() => buildVocabularyInventory(skillCatalog), []);
  const selectedSkill = skillCatalog.find((skill) => skill.id === selectedSkillId) ?? skillCatalog[0];
  const compiledPrompt = useMemo(
    () => (selectedSkill ? compileSkillPrompt(selectedSkill, { mainRef: 'main (current head required)' }) : null),
    [selectedSkill],
  );

  const filteredSkills = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('de-DE');
    if (!query) return skillCatalog;
    return skillCatalog.filter((skill) =>
      [skill.id, skill.label, skill.component, skill.scope, ...skill.componentPaths]
        .join(' ')
        .toLocaleLowerCase('de-DE')
        .includes(query),
    );
  }, [searchTerm]);

  const errors = validationFindings.filter((finding) => finding.severity === 'error');
  const canonicalVocabulary = vocabularyInventory.filter((entry) => entry.status === 'CANONICAL' || entry.status === 'ALIAS');
  const vocabularyCandidates = vocabularyInventory.filter((entry) => entry.status === 'NEW_CANDIDATE');

  const copyPrompt = async () => {
    if (!compiledPrompt) return;
    await navigator.clipboard?.writeText(`${compiledPrompt.systemPrompt}\n\n${compiledPrompt.contextPrompt}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const tabs: Array<{ id: SkillEngineTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'registry', label: 'Skill Registry', icon: Cpu },
    { id: 'errors', label: 'Fehlerklassen', icon: AlertTriangle },
    { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
    { id: 'priorities', label: 'Prioritäten', icon: ListChecks },
    { id: 'prompt', label: 'Prompt Preview', icon: Sparkles },
  ];

  return (
    <section className="space-y-5" aria-label="CAPITAL-AI Skill Engine">
      <div className="rounded-2xl border border-aif-gold-DEFAULT/25 bg-gradient-to-br from-neutral-950 via-[#151515] to-neutral-950 p-5 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-aif-gold-DEFAULT/30 bg-aif-gold-DEFAULT/10 px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-widest text-aif-gold-DEFAULT">
                <ShieldCheck size={12} /> Read-only Quality Control Plane
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-300">
                No autonomous mutation
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">CAPITAL-AI Skill Engine</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/55">
              Komponentenbezogene Verifikation mit einer gemeinsamen Fehlerklassen-, Vocabulary- und Structured-Output-Schicht. Die Engine kompiliert schlanke, model-agnostische Prompts; sie startet im Admin-Panel keine kostenpflichtigen Modellaufrufe.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Skills" value={skillCatalog.length} />
            <Metric label="Fehlerklassen" value={errorClasses.length} />
            <Metric label="Vocabulary" value={vocabularyInventory.length} />
            <Metric label="Catalog Errors" value={errors.length} attention={errors.length > 0} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-black/30 p-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition ${
              activeTab === id
                ? 'border-aif-gold-DEFAULT bg-aif-gold-DEFAULT text-black'
                : 'border-white/5 bg-white/[0.03] text-white/60 hover:border-white/15 hover:text-white'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'registry' && (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/5 bg-neutral-950/70 p-4">
            <label className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
              <Search size={14} className="text-white/40" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Skill, Komponente oder Pfad suchen"
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25"
              />
            </label>
            <div className="max-h-[650px] space-y-2 overflow-y-auto pr-1">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedSkill?.id === skill.id
                      ? 'border-aif-gold-DEFAULT/50 bg-aif-gold-DEFAULT/10'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-white">{skill.label}</p>
                      <p className="mt-1 font-mono text-[10px] text-white/35">{skill.id}</p>
                    </div>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-black ${priorityClass[skill.priority]}`}>{skill.priority}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedSkill && (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-neutral-950/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-aif-gold-DEFAULT">{selectedSkill.id}</p>
                  <h4 className="mt-1 text-xl font-black text-white">{selectedSkill.label}</h4>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">{selectedSkill.scope}</p>
                </div>
                <div className="flex gap-2">
                  <Badge>{selectedSkill.executionProfile}</Badge>
                  <span className={`rounded-lg border px-2 py-1 text-xs font-black ${priorityClass[selectedSkill.priority]}`}>{selectedSkill.priority}</span>
                </div>
              </div>

              <InfoBlock title="Komponentenpfade" icon={<GitBranch size={14} />} items={selectedSkill.componentPaths} />
              <InfoBlock title="Verification Focus" icon={<ShieldCheck size={14} />} items={selectedSkill.focus} />
              <InfoBlock title="Applicable Authorities" icon={<BookOpen size={14} />} items={selectedSkill.authorities} />

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-300">Quick Wins</p>
                  <div className="space-y-3">
                    {selectedSkill.quickWins.map((item) => (
                      <div key={item.id}>
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/45">{item.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.04] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-wider text-sky-300">Aufbauende Weiterentwicklung</p>
                  <div className="space-y-3">
                    {selectedSkill.developments.map((item) => (
                      <div key={item.id}>
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-white/45">{item.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-neutral-950/70">
          <div className="grid grid-cols-[90px_180px_110px_minmax(280px,1fr)] gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-3 text-[10px] font-mono font-black uppercase tracking-wider text-white/35">
            <span>ID</span><span>Klasse</span><span>Default</span><span>Definition</span>
          </div>
          {errorClasses.map((errorClass) => (
            <div key={errorClass.id} className="grid grid-cols-[90px_180px_110px_minmax(280px,1fr)] gap-3 border-b border-white/[0.04] px-4 py-3 text-xs last:border-b-0">
              <span className="font-mono font-bold text-aif-gold-DEFAULT">{errorClass.id}</span>
              <span className="font-mono text-white/70">{errorClass.name}</span>
              <span className="uppercase text-white/45">{errorClass.defaultSeverity}</span>
              <span className="text-white/55">{errorClass.description}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'vocabulary' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Registry-resolved" value={canonicalVocabulary.length} />
            <Metric label="Neue Kandidaten" value={vocabularyCandidates.length} attention={vocabularyCandidates.length > 0} />
            <Metric label="Forbidden" value={vocabularyInventory.filter((entry) => entry.status === 'FORBIDDEN').length} attention />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-neutral-950/70">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="bg-white/[0.03] font-mono text-[10px] uppercase tracking-wider text-white/35">
                <tr><th className="px-4 py-3">Term</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Concept ID</th><th className="px-4 py-3">Canonical</th><th className="px-4 py-3">Skill-Nutzung</th></tr>
              </thead>
              <tbody>
                {vocabularyInventory.map((entry) => (
                  <tr key={entry.normalizedTerm} className="border-t border-white/[0.04]">
                    <td className="px-4 py-3 font-semibold text-white">{entry.term}</td>
                    <td className="px-4 py-3"><VocabularyStatus status={entry.status} /></td>
                    <td className="px-4 py-3 font-mono text-white/45">{entry.conceptId ?? '—'}</td>
                    <td className="px-4 py-3 text-white/55">{entry.canonicalTerm ?? 'Review candidate'}</td>
                    <td className="px-4 py-3 text-white/45">{entry.usedBySkillIds.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'priorities' && (
        <div className="grid gap-4 xl:grid-cols-4">
          {priorityOrder.map((priority) => {
            const skills = skillCatalog.filter((skill) => skill.priority === priority);
            return (
              <div key={priority} className={`rounded-2xl border p-4 ${priorityClass[priority]}`}>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-lg font-black">{priority}</p>
                  <span className="font-mono text-xs">{skills.length} Skills</span>
                </div>
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <button key={skill.id} type="button" onClick={() => { setSelectedSkillId(skill.id); setActiveTab('registry'); }} className="w-full rounded-lg border border-current/15 bg-black/20 p-2.5 text-left text-xs text-white/80 hover:bg-black/30">
                      <span className="font-bold">{skill.label}</span>
                      <span className="mt-1 block font-mono text-[9px] text-white/35">{skill.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'prompt' && selectedSkill && compiledPrompt && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-neutral-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-white">{selectedSkill.label}</p>
              <p className="mt-1 font-mono text-[10px] text-white/35">Cache key: {compiledPrompt.cacheKey}</p>
            </div>
            <button type="button" onClick={copyPrompt} className="inline-flex items-center justify-center gap-2 rounded-lg border border-aif-gold-DEFAULT/25 bg-aif-gold-DEFAULT/10 px-3 py-2 text-xs font-bold text-aif-gold-DEFAULT hover:bg-aif-gold-DEFAULT/15">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopiert' : 'Prompt kopieren'}
            </button>
          </div>
          <PromptBlock title="Stabiler System-Prompt" text={compiledPrompt.systemPrompt} />
          <PromptBlock title="Dynamischer Komponenten-Kontext" text={compiledPrompt.contextPrompt} />
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-white/55">
            <strong className="text-sky-300">Structured Output:</strong> Das JSON-Schema wird getrennt vom Natural-Language-Prompt exportiert. Ein späterer Provider-Adapter soll es über native Structured Outputs / JSON Schema übergeben, statt das Schema in jeden Prompt zu kopieren.
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, attention = false }: { label: string; value: number; attention?: boolean }) {
  return (
    <div className={`min-w-[108px] rounded-xl border px-3 py-2 ${attention ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-white/5 bg-black/30'}`}>
      <p className="font-mono text-[9px] uppercase tracking-wider text-white/35">{label}</p>
      <p className={`mt-1 text-xl font-black ${attention ? 'text-amber-300' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55">{children}</span>;
}

function InfoBlock({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/25 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/70">{icon}{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] text-white/50">{item}</span>)}
      </div>
    </div>
  );
}

function VocabularyStatus({ status }: { status: string }) {
  const style = status === 'CANONICAL' || status === 'ALIAS'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
    : status === 'FORBIDDEN'
      ? 'border-rose-500/25 bg-rose-500/10 text-rose-300'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-300';
  return <span className={`rounded-md border px-2 py-1 font-mono text-[9px] font-black ${style}`}>{status}</span>;
}

function PromptBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-neutral-950/70">
      <div className="border-b border-white/5 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-wider text-white/60">{title}</div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[11px] leading-relaxed text-white/60">{text}</pre>
    </div>
  );
}
