export const PR_DECISION_STATUSES = Object.freeze([
  'READY_FOR_HUMAN_DECISION',
  'EVIDENCE_PENDING',
  'BLOCKED',
]);

export const PR_DECISION_GATE_STATES = Object.freeze([
  'PASS',
  'PENDING',
  'BLOCKED',
]);

export const PR_DECISION_GATES = Object.freeze([
  Object.freeze({ key: 'main', label: 'Current Main' }),
  Object.freeze({ key: 'scope', label: 'Scope / Ownership' }),
  Object.freeze({ key: 'overlap', label: 'Overlap' }),
  Object.freeze({ key: 'checks', label: 'Required Checks' }),
  Object.freeze({ key: 'security', label: 'Security / Compliance' }),
  Object.freeze({ key: 'baseline', label: 'Production Baseline' }),
]);

const GATE_PRESENTATION = Object.freeze({
  PASS: '🟢 PASS',
  PENDING: '🟡 PENDING',
  BLOCKED: '🔴 BLOCKED',
});

export function normalizeDecisionGateState(value, fallback = 'PENDING') {
  const normalized = String(value || '')
    .replace(/^[🟢🟡🔴]\s*/u, '')
    .trim()
    .toUpperCase();
  if (PR_DECISION_GATE_STATES.includes(normalized)) return normalized;
  if (!PR_DECISION_GATE_STATES.includes(fallback)) {
    throw new Error('Invalid decision-gate fallback: ' + fallback);
  }
  return fallback;
}

export function formatDecisionGateState(value) {
  return GATE_PRESENTATION[normalizeDecisionGateState(value)] || GATE_PRESENTATION.PENDING;
}

export function deriveDecisionStatus(gates) {
  const states = PR_DECISION_GATES.map(({ key }) =>
    normalizeDecisionGateState(gates?.[key], 'PENDING')
  );
  if (states.includes('BLOCKED')) return 'BLOCKED';
  if (states.every((state) => state === 'PASS')) return 'READY_FOR_HUMAN_DECISION';
  return 'EVIDENCE_PENDING';
}

export function summarizeDecisionEvidence(gates) {
  const status = deriveDecisionStatus(gates);
  if (status === 'READY_FOR_HUMAN_DECISION') return 'Alle erforderlichen Gates erfüllt';
  if (status === 'BLOCKED') return 'Mindestens ein zwingendes Gate blockiert';
  return 'Erforderliche Evidence ist noch unvollständig';
}

export function summarizeDecisionBlockers(gates) {
  const blocked = [];
  const pending = [];
  for (const { key, label } of PR_DECISION_GATES) {
    const state = normalizeDecisionGateState(gates?.[key], 'PENDING');
    if (state === 'BLOCKED') blocked.push(label);
    if (state === 'PENDING') pending.push(label);
  }
  if (blocked.length > 0) return 'Blockiert: ' + blocked.join(', ');
  if (pending.length > 0) return 'Keine harten Blocker; ausstehend: ' + pending.join(', ');
  return 'Keine';
}

export function decisionImpactLabel(prClass, securityGate = 'PENDING') {
  const klass = String(prClass || '').trim().toUpperCase();
  const labels = Object.freeze({
    D: 'D — Dokumentation/Governance',
    C: 'C — Code/Tests/Config',
    R: 'R — Runtime/Dependency/Deployment',
    M: 'M — geschützte externe/produktive Mutation',
  });
  const base = labels[klass] || 'N/A — PR-Klasse nicht aufgelöst';
  const security = normalizeDecisionGateState(securityGate, 'PENDING');
  return security === 'BLOCKED' ? base + ' · Security/Compliance BLOCKED' : base;
}

export function extractDecisionStatus(bodyText) {
  return String(bodyText || '').match(
    /^> 🧭 \*\*Entscheidungsstatus: (READY_FOR_HUMAN_DECISION|EVIDENCE_PENDING|BLOCKED)\*\*\s*$/m,
  )?.[1] || null;
}

export function extractDecisionGates(bodyText) {
  const body = String(bodyText || '');
  const gates = {};
  for (const { key, label } of PR_DECISION_GATES) {
    const escaped = label.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    const match = body.match(new RegExp('^\\|\\s*' + escaped + '\\s*\\|\\s*(?:🟢|🟡|🔴)?\\s*(PASS|PENDING|BLOCKED)\\s*\\|$', 'm'));
    gates[key] = match?.[1] || null;
  }
  return gates;
}
