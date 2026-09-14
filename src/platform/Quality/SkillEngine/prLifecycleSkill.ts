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
  ],
  developments: [
    {
      id: 'F-PRL-1',
      title: 'Create-Gate Evidence Artifact',
      benefit: 'Owner-Freigabe, Envelope-Digest und Correlation-Result werden als unveränderliches Create-Evidence persistiert.',
      horizon: 'next',
    },
  ],
};
