import type { VerificationSkill } from './types';

export const prLifecycleSkill: VerificationSkill = {
  id: 'VERIFY-PR-LIFECYCLE',
  label: 'PR Lifecycle',
  component: 'PullRequestLifecycle',
  componentPaths: [
    'scripts/pr',
    '.github/workflows/open-agent-draft-pr.yml',
    '.github/workflows/pr-governance.yml',
    'docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md',
  ],
  priority: 'P0',
  executionProfile: 'deep',
  scope: 'Fail-closed PR create correlation, trusted Draft-PR creation, ordered Roadmap sequencing, writer correlation and Human/CODEOWNER merge boundary for main-targeting pull requests.',
  authorities: [
    'AGENTS.md',
    'AUTH-GOV-HUMAN-OWNER-PR-APPROVAL',
    'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
    'docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md',
  ],
  focus: [
    'Create correlation is evaluated fail-closed as PASS or BLOCKED before PR or Draft-PR creation',
    'Current main, branch head, merge base and open writers are refreshed immediately before create',
    'Writer/file/semantic/namespace/authority/ownership/security overlap is correlated at create time',
    'Validation is truthful; NOT RUN may not be represented as PASS',
    'Automated Roadmap successors wait for predecessor terminal outcome and restart from resulting current main after merge',
    'No parallel PR-create authority, candidate self-bootstrap, auto-merge or retired M10 bypass',
  ],
  errorClassIds: ['EC-05', 'EC-11', 'EC-22'],
  vocabularyTerms: [
    'PullRequest',
    'CreateCorrelation',
    'DraftPullRequest',
    'OwnerReview',
    'WorkClaim',
    'ProductionBaseline',
  ],
  quickWins: [
    {
      id: 'QW-PRL-1',
      title: 'Create-Pfad an finalen Korrelations-PASS binden',
      outcome: 'Draft-PR-Erzeugung wird bei BLOCKED, stale oder ungeklärter Create-Korrelation fail-closed verhindert.',
      effort: 'low',
    },
    {
      id: 'QW-PRL-2',
      title: 'Create-Correlation Evidence Artifact',
      outcome: 'Main/Head/Merge-Base, Scope, Overlap und Validation werden als Evidence persistiert; hartcodiertes PASS bleibt verboten.',
      effort: 'low',
    },
    {
      id: 'QW-PRL-3',
      title: 'Roadmap-PR-Lane serialisieren',
      outcome: 'Ein Nachfolger entsteht erst nach terminalem Vorgängerzustand und nach Merge aus dem resultierenden current main.',
      effort: 'low',
    },
  ],
  developments: [
    {
      id: 'F-PRL-1',
      title: 'Unabhängige Security-Korrelation jenseits des Create-Jobs',
      benefit: 'Security-PASS kommt aus einem separaten Verifier und nicht nur aus Actor+Overlap im selben Job.',
      horizon: 'next',
    },
  ],
};
