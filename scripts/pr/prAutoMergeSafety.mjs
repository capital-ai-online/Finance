import { createHash } from 'node:crypto';

export const AUTO_MERGE_EVIDENCE_START = '<!-- CAPITAL_AI_AUTO_MERGE_EVIDENCE_START -->';
export const AUTO_MERGE_EVIDENCE_END = '<!-- CAPITAL_AI_AUTO_MERGE_EVIDENCE_END -->';
export const AUTO_MERGE_ELIGIBLE = 'AUTO_MERGE_ELIGIBLE';
export const HUMAN_MERGE_REQUIRED = 'HUMAN_MERGE_REQUIRED';

const PROTECTED_PATH_RULES = Object.freeze([
  ['trust-root', /^AGENTS\.md$/],
  ['governance-control-plane', /^(?:docs\/governance\/|scripts\/pr\/|policy\/|\.github\/(?:workflows\/|CODEOWNERS$|pull_request_template\.md$))/i],
  ['security-sensitive', /^(?:src\/platform\/Security\/|scripts\/security\/|server\/security\/|docs\/security\/)/i],
  ['iam-or-secret', /(?:^|\/)(?:iam|secrets?|credentials?)(?:\/|\.|-|$)/i],
  ['database-schema-migration', /(?:^|\/)(?:supabase\/migrations|migrations?|schema|prisma|database)(?:\/|\.|-|$)/i],
  ['production-runtime-deployment', /^(?:server\/|render\.yaml$|Dockerfile(?:\..*)?$|\.github\/workflows\/.*deploy)/i],
  ['billing-or-dns', /(?:billing|cost-center|ionos-dns|(?:^|[-_/])dns(?:[-_/]|$))/i],
  ['protected-recovery', /(?:rollback|restore|recovery)/i],
  ['merge-ruleset-authority', /(?:ruleset|branch-protection|merge-authority)/i],
]);

function escapeRegex(value) {
  return String(value).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function normalizeAutoMergeSha(value) {
  return String(value || '').trim().toLowerCase();
}

export function trustedAutoMergeBranch(pr, repository) {
  const head = String(pr?.head?.ref || '');
  const owner = String(repository || '').split('/')[0];
  const author = String(pr?.user?.login || '');
  if (/^(?:agent|claude|grok|ai)\//.test(head)) return true;
  if (/^(?:feat|fix|hotfix|chore|refactor|docs|test|perf|security)\//.test(head)) {
    return Boolean(owner) && author === owner;
  }
  return false;
}

export function protectedAutoMergeReasons({ pr, body, files }) {
  const reasons = new Set();
  const title = String(pr?.title || '');
  const text = String(body || '');
  if (/\[CAPITAL-AI-GOV\]/i.test(title)) reasons.add('governance-control-plane');
  if (/\[CAPITAL-AI-SEC\]/i.test(title)) reasons.add('security-sensitive');
  if (/(?:^|\n)(?:>\s*)?P0(?:\s|🔴|·|$)/m.test(text) || /\*\*Priorität:\*\*\s*P0\b/i.test(text)) {
    reasons.add('p0');
  }
  for (const file of files || []) {
    const pathname = String(file || '');
    for (const [reason, pattern] of PROTECTED_PATH_RULES) {
      if (pattern.test(pathname)) reasons.add(reason);
    }
  }
  return [...reasons].sort();
}

export function classifyAutoMergeEligibility({ pr, repository, body, files, gates, compareStatus }) {
  const reasons = [];
  const sameRepository = pr?.head?.repo?.full_name === repository;
  const nonDraft = pr?.draft === false;
  const trustedBranch = trustedAutoMergeBranch(pr, repository);
  const synchronized = ['ahead', 'identical'].includes(String(compareStatus || ''));

  if (!sameRepository) reasons.push('cross-repository');
  if (pr?.base?.ref !== 'main') reasons.push('base-not-main');
  if (!nonDraft) reasons.push('draft');
  if (!trustedBranch) reasons.push('untrusted-work-branch');
  if (!synchronized) reasons.push('current-main-not-ancestor');

  const gateEntries = Object.entries(gates || {});
  if (gateEntries.length === 0 || gateEntries.some(([, state]) => state !== 'PASS')) {
    reasons.push('decision-gates-not-pass');
  }
  reasons.push(...protectedAutoMergeReasons({ pr, body, files }));

  const uniqueReasons = [...new Set(reasons)].sort();
  return {
    eligible: uniqueReasons.length === 0,
    reasons: uniqueReasons,
    branchSyncRequired:
      sameRepository &&
      nonDraft &&
      trustedBranch &&
      pr?.base?.ref === 'main' &&
      !synchronized,
  };
}

export function requiredCheckEvidence(policy) {
  return (policy?.requiredChecks || [])
    .map((check) => String(check?.context || '').trim() + '::' + (check?.integrationId ?? '*'))
    .filter((value) => !value.startsWith('::'))
    .sort();
}

export function requiredCheckFingerprint(policy) {
  const canonical = requiredCheckEvidence(policy).join('\n') + '\n';
  return 'sha256:' + createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function parseAutoMergeEvidence(bodyText) {
  const body = String(bodyText || '');
  const startCount = body.split(AUTO_MERGE_EVIDENCE_START).length - 1;
  const endCount = body.split(AUTO_MERGE_EVIDENCE_END).length - 1;
  if (startCount === 0 && endCount === 0) return null;
  if (startCount !== 1 || endCount !== 1) return { malformed: true };

  const start = body.indexOf(AUTO_MERGE_EVIDENCE_START);
  const end = body.indexOf(AUTO_MERGE_EVIDENCE_END, start);
  if (end <= start) return { malformed: true };
  const block = body.slice(start, end + AUTO_MERGE_EVIDENCE_END.length);
  const read = (label) =>
    block.match(new RegExp('^- \\*\\*' + escapeRegex(label) + ':\\*\\* `([^`\\n]+)`\\s*$', 'm'))?.[1]?.trim() || '';

  return {
    malformed: false,
    contract: read('Auto-Merge Contract'),
    headSha: normalizeAutoMergeSha(read('Auto-Merge Head')),
    baseSha: normalizeAutoMergeSha(read('Auto-Merge Base')),
    requiredChecksFingerprint: read('Auto-Merge Required Checks Fingerprint'),
    correlation: read('Auto-Merge Correlation'),
    state: read('Auto-Merge State'),
    evaluatedAt: read('Auto-Merge Evaluated At'),
    reason: read('Auto-Merge Reason'),
  };
}

export function autoMergeEvidenceMatches(observed, expected) {
  return Boolean(
    observed &&
    !observed.malformed &&
    observed.contract === expected.contract &&
    observed.headSha === expected.headSha &&
    observed.baseSha === expected.baseSha &&
    observed.requiredChecksFingerprint === expected.requiredChecksFingerprint &&
    observed.correlation: read('Auto-Merge Correlation'),
    state: read('Auto-Merge State'),
    evaluatedAt: read('Auto-Merge Evaluated At'),
    reason: read('Auto-Merge Reason'),
  };
}

export function autoMergeEvidenceMatches(observed, expected) {
  return Boolean(
    observed &&
    !observed.malformed &&
    observed.contract === expected.contract &&
    observed.headSha === expected.headSha &&
    observed.baseSha === expected.baseSha &&
    observed.requiredChecksFingerprint === expected.requiredChecksFingerprint &&
    observed.correlation === expected.correlation &&
    observed.reason === expected.reason
  );
}

function replaceDecisionRow(bodyText, label, value) {
  const body = String(bodyText || '');
  const expression = new RegExp('^\\|\\s*' + escapeRegex(label) + '\\s*\\|.*\\|$', 'gm');
  const matches = [...body.matchAll(expression)];
  if (matches.length !== 1) return null;
  return body.replace(expression, '| ' + label + ' | ' + String(value).replace(/\|/g, '/') + ' |');
}

function replaceTechnicalField(bodyText, label, value) {
  const body = String(bodyText || '');
  const expression = new RegExp('^- \\*\\*' + escapeRegex(label) + ':\\*\\*.*$', 'gm');
  const matches = [...body.matchAll(expression)];
  if (matches.length > 1) return null;
  if (matches.length === 0) return body;
  return body.replace(expression, '- **' + label + ':** ' + value);
}

export function reconcileAutoMergeProjection(bodyText, evidence) {
  const original = String(bodyText || '');
  const existing = parseAutoMergeEvidence(original);
  if (existing?.malformed) {
    return { eligible: false, changed: false, reason: 'auto-merge-evidence-boundary-ambiguous', body: original };
  }

  const requiredChecksText = (evidence.requiredChecks || []).join('; ') || 'none';
  const block = [
    AUTO_MERGE_EVIDENCE_START,
    '- **Auto-Merge Contract:** `' + evidence.contract + '`',
    '- **Auto-Merge Head:** `' + evidence.headSha + '`',
    '- **Auto-Merge Base:** `' + evidence.baseSha + '`',
    '- **Auto-Merge Required Checks Fingerprint:** `' + evidence.requiredChecksFingerprint + '`',
    '- **Auto-Merge Required Check Set:** ' + requiredChecksText,
    '- **Auto-Merge Correlation:** `' + evidence.correlation + '`',
    '- **Auto-Merge State:** `' + evidence.state + '`',
    '- **Auto-Merge Evaluated At:** `' + evidence.evaluatedAt + '`',
    '- **Auto-Merge Reason:** `' + evidence.reason + '`',
    AUTO_MERGE_EVIDENCE_END,
  ].join('\n');

  let body = original;
  if (existing) {
    const start = body.indexOf(AUTO_MERGE_EVIDENCE_START);
    const end = body.indexOf(AUTO_MERGE_EVIDENCE_END, start) + AUTO_MERGE_EVIDENCE_END.length;
    body = body.slice(0, start) + block + body.slice(end);
  } else {
    const heading = '## 3. 🔍 Technical Evidence';
    const index = body.indexOf(heading);
    if (index < 0) {
      return { eligible: false, changed: false, reason: 'technical-evidence-heading-missing', body: original };
    }
    const insertion = index + heading.length;
    body = body.slice(0, insertion) + '\n\n### Auto-Merge Safety Evidence\n\n' + block + body.slice(insertion);
  }

  const autoEligible = evidence.contract === AUTO_MERGE_ELIGIBLE;
  const ownerAction = autoEligible
    ? 'Keine manuelle Merge-Aktion; GitHub Auto-Merge nach Exact-Head-Revalidierung'
    : 'Human/CODEOWNER Merge erforderlich';
  const ownerUpdated = replaceDecisionRow(body, 'Owner-Aktion', ownerAction);
  if (ownerUpdated == null) {
    return { eligible: false, changed: false, reason: 'owner-action-row-ambiguous', body: original };
  }
  body = ownerUpdated;

  const fields = [
    ['Merge-Modus', evidence.contract],
    ['Human-/CODEOWNER-Freigabe für Merge erforderlich', autoEligible ? 'Nein — GitHub Auto-Merge Safety Contract' : 'Ja'],
    ['Auto-Merge', autoEligible ? AUTO_MERGE_ELIGIBLE : 'Nein — ' + evidence.reason],
  ];
  for (const [label, value] of fields) {
    const updated = replaceTechnicalField(body, label, value);
    if (updated == null) {
      return { eligible: false, changed: false, reason: 'technical-field-ambiguous:' + label, body: original };
    }
    body = updated;
  }

  return {
    eligible: true,
    changed: body !== original,
    reason: body === original ? 'auto-merge-projection-current' : 'auto-merge-projection-reconciled',
    body,
  };
}

export function governanceCheckFreshAfterDeclaration(governanceRun, evaluatedAt) {
  if (!governanceRun || governanceRun.status !== 'completed' || governanceRun.conclusion !== 'success') return false;
  const threshold = Date.parse(String(evaluatedAt || ''));
  const observed = Date.parse(
    String(governanceRun.completed_at || governanceRun.started_at || governanceRun.created_at || ''),
  );
  return Number.isFinite(threshold) && Number.isFinite(observed) && observed >= threshold;
}

export function resolveAutoMergeMethod(repositorySettings) {
  if (repositorySettings?.allow_merge_commit) return 'MERGE';
  if (repositorySettings?.allow_squash_merge) return 'SQUASH';
  if (repositorySettings?.allow_rebase_merge) return 'REBASE';
  return null;
}
