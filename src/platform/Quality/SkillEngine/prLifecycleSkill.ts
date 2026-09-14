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
  scope: 'Human/Owner Approval Envelope, trusted Draft-PR creation, writer correlation and merge boundary for main-targeting pull requests.',
  authorities: [
    'AGENTS.md',
    'AUTH-GOV-HUMAN-OWNER-PR-APPROVAL',
    'docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md',
    'ADR-0039',
  ],
  focus: [
    'Approval Envelope is evaluated fail-closed before PR or Draft-PR creation',
    'Create-workflow principal and phrase binding',
    'Writer/overlap correlation at create time',
    'Create-correlation evidence artifact is required; PASS may not be hardcoded',
    'No parallel PR-create authority or retired M10 bypass',
  ],
  errorClassIds: ['EC-05', 'EC-11', 'EC-22'],
  vocabularyTerms: [
    'PullRequest',
    'ApprovalEnvelope',
    'DraftPullRequest',
    'OwnerApproval',
    'WorkClaim',
    'ProductionBaseline',
  ],
  quickWins: [
    {
      id: 'QW-PRL-1',
      title: 'Create-Pfad an bestehendes Approval Envelope binden',
      outcome: 'Draft-PR-Erzeugung ohne APPROVAL_STILL_VALID wird fail-closed verhindert.',
      effort: 'low',
    },
    {
      id: 'QW-PRL-2',
      title: 'Create-Gate Evidence Artifact',
      outcome: 'Owner-Freigabe, Envelope und Correlation-Result werden als Artifact persistiert; Workflow-Literale PASS sind verboten.',
      effort: 'low',
    },
    {
      id: 'QW-PRL-3',
      title: 'Owner-Dispatch und M10-Bypass entfernen',
      outcome: 'Nur SvenKulessa darf den Create-Workflow auslösen; der branch-namenbasierte M10-Governance-Bypass ist tot.',
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
