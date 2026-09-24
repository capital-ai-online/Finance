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
  Object.freeze({ key: 'baseline', label: 'Production / Deploy Cadence', aliases: Object.freeze(['Production Baseline']) }),
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

const GATE_DETAIL_PRESENTATION = Object.freeze({
  main: Object.freeze({
    PASS: Object.freeze({ reason: 'PR-Head enthält CURRENT_MAIN.', nextStep: 'Keine Gate-Aktion erforderlich.' }),
    PENDING: Object.freeze({ reason: 'Current-Main-Abstammung ist noch nicht verifiziert.', nextStep: 'Main-/Head-Readback erneut korrelieren.' }),
    BLOCKED: Object.freeze({ reason: 'PR-Head enthält CURRENT_MAIN nicht.', nextStep: 'Kanonischen Branch-Sync gegen CURRENT_MAIN ausführen.' }),
  }),
  scope: Object.freeze({
    PASS: Object.freeze({ reason: 'Scope und Ownership sind durch die kanonische Governance bestätigt.', nextStep: 'Keine Gate-Aktion erforderlich.' }),
    PENDING: Object.freeze({ reason: 'Scope-/Ownership-Evidence ist noch nicht vollständig.', nextStep: 'Owner/PVC-/Projektzuordnung vervollständigen und Governance erneut auswerten.' }),
    BLOCKED: Object.freeze({ reason: 'Scope-/Ownership-Governance ist nicht erfolgreich.', nextStep: 'Scope-/Ownership-Konflikt beheben und Governance erneut ausführen.' }),
  }),
  overlap: Object.freeze({
    PASS: Object.freeze({ reason: 'Kein blockierender Changed-File-Overlap mit offenen PRs erkannt.', nextStep: 'Keine Gate-Aktion erforderlich.' }),
    PENDING: Object.freeze({ reason: 'Overlap-Evidence ist noch nicht vollständig.', nextStep: 'Offene PRs und Changed-File-Overlap erneut korrelieren.' }),
    BLOCKED: Object.freeze({ reason: 'Mindestens ein blockierender Overlap mit einem offenen PR ist vorhanden.', nextStep: 'Overlap auflösen oder als semantischen Konflikt fail-closed eskalieren.' }),
  }),
  checks: Object.freeze({
    PASS: Object.freeze({ reason: 'Alle Required Checks sind auf dem Exact Head erfolgreich.', nextStep: 'Keine Gate-Aktion erforderlich.' }),
    PENDING: Object.freeze({ reason: 'Mindestens ein Required Check fehlt oder ist noch nicht terminal erfolgreich.', nextStep: 'Ausstehende Exact-Head-Checks abschließen und Evidence neu lesen.' }),
    BLOCKED: Object.freeze({ reason: 'Mindestens ein Required Check ist fehlgeschlagen oder ungültig.', nextStep: 'Fehlgeschlagenen Check anhand seiner Evidence beheben und Exact-Head-Verifikation erneut ausführen.' }),
  }),
  security: Object.freeze({
    PASS: Object.freeze({ reason: 'Erforderliche Security-/Compliance-Checks sind erfolgreich.', nextStep: 'Keine Gate-Aktion erforderlich.' }),
    PENDING: Object.freeze({ reason: 'Security-/Compliance-Evidence fehlt oder ist noch nicht terminal.', nextStep: 'Ausstehende Security-/Compliance-Checks abschließen.' }),
    BLOCKED: Object.freeze({ reason: 'Mindestens ein erforderlicher Security-/Compliance-Check ist nicht erfolgreich.', nextStep: 'Security-/Compliance-Fund beheben; kein Bypass oder Downgrade.' }),
  }),
  baseline: Object.freeze({
    PASS: Object.freeze({ reason: 'Production-Identität, CURRENT_MAIN und PR-Head sind atomar korreliert; erwarteter 5er-Cadence-Lag ist kein Production-Drift.', nextStep: 'Keine Gate-Aktion erforderlich.' }),
    PENDING: Object.freeze({ reason: 'Production-/Deploy-Cadence-Evidence ist noch nicht vollständig auswertbar.', nextStep: 'Kanonischen Baseline-/Decision-Reconciler ausführen und Exact-Head/Main-Evidence neu lesen.' }),
    BLOCKED: Object.freeze({ reason: 'Production-Identität, CURRENT_MAIN oder PR-Head sind nicht sicher korreliert; erwarteter DEPLOYMENT_QUEUED-Lag allein blockiert nicht.', nextStep: 'Baseline ausschließlich über den kanonischen Baseline-/Decision-Reconciler aktualisieren.' }),
  }),
});

export function decisionGateDetail(key, value, override = {}) {
  const state = normalizeDecisionGateState(value, 'PENDING');
  const fallback = GATE_DETAIL_PRESENTATION[key]?.[state] || {
    reason: 'Gate-Evidence ist nicht auflösbar.',
    nextStep: 'Gate fail-closed erneut auswerten.',
  };
  return {
    reason: String(override?.reason || fallback.reason).replace(/\s+/g, ' ').trim(),
    nextStep: String(override?.nextStep || fallback.nextStep).replace(/\s+/g, ' ').trim(),
  };
}

export function decisionEvidenceRows(gates, details = {}) {
  return PR_DECISION_GATES.map(({ key, label }) => {
    const state = normalizeDecisionGateState(gates?.[key], 'PENDING');
    const detail = decisionGateDetail(key, state, details?.[key]);
    return { key, label, state, status: formatDecisionGateState(state), reason: detail.reason, nextStep: detail.nextStep };
  });
}

export function summarizeLiveDecisionSync(gates) {
  return [
    'Main ' + formatDecisionGateState(gates?.main),
    'Checks ' + formatDecisionGateState(gates?.checks),
    'Security ' + formatDecisionGateState(gates?.security),
    'Baseline ' + formatDecisionGateState(gates?.baseline),
  ].join(' · ');
}

export function nextVerifiableDecisionStep(gates) {
  const blocked = [];
  const pending = [];
  for (const { key, label } of PR_DECISION_GATES) {
    const state = normalizeDecisionGateState(gates?.[key], 'PENDING');
    if (state === 'BLOCKED') blocked.push(label);
    else if (state === 'PENDING') pending.push(label);
  }
  if (blocked.length > 0) return 'Blocker beheben und Evidence neu korrelieren: ' + blocked.join(', ');
  if (pending.length > 0) return 'Ausstehende Evidence vervollständigen: ' + pending.join(', ');
  return 'Merge-Modus anhand des Auto-Merge Safety Contract revalidieren';
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

export const VERSION_DEPLOYS_PER_PATCH = 2;

export function deriveVersionCadenceEvidence(cadence = {}) {
  const fallback = {
    label: 'Version / Deploy-Zyklus',
    status: '📡 LIVE',
    reason: 'Aktuelle Versions-/Deploy-Cadence ist nicht vollständig auflösbar.',
    nextStep: 'Kanonische mergeCadence-Evidence erneut lesen.',
    currentVersion: 'N/A',
    nextPatchVersion: 'N/A',
    deployProgress: 'N/A',
    deployTotal: VERSION_DEPLOYS_PER_PATCH,
    deployRemaining: 'N/A',
    versionProgress: 'N/A',
    versionRemaining: 'N/A',
  };
  if (cadence?.active !== true) return { ...fallback, status: '📡 LEGACY' };

  const versionProgress = Number(cadence.versionProgress);
  const versionRemaining = Number(cadence.versionRemaining);
  const currentVersion = String(cadence.currentVersion || '').trim();
  const nextPatchVersion = String(cadence.nextPatchVersion || '').trim();
  if (
    !Number.isInteger(versionProgress) || versionProgress < 0 || versionProgress > 9 ||
    !Number.isInteger(versionRemaining) || versionRemaining < 1 || versionRemaining > 10 ||
    !currentVersion || !nextPatchVersion
  ) return fallback;

  const deployProgress = Math.floor(versionProgress / 5);
  const deployRemaining = VERSION_DEPLOYS_PER_PATCH - deployProgress;
  return {
    label: 'Version / Deploy-Zyklus',
    status: '📡 LIVE',
    reason:
      'Aktuelle Version `' + currentVersion + '` · Deploy-Zyklus bis nächste Version: `' +
      deployProgress + '/' + VERSION_DEPLOYS_PER_PATCH + '` · noch `' + deployRemaining +
      '` Deploy-Grenze(n).',
    nextStep:
      'Nächstes PATCH `' + nextPatchVersion + '` · Merge-Fortschritt `' +
      versionProgress + '/10` · noch `' + versionRemaining + '` Merge(s).',
    currentVersion,
    nextPatchVersion,
    deployProgress,
    deployTotal: VERSION_DEPLOYS_PER_PATCH,
    deployRemaining,
    versionProgress,
    versionRemaining,
  };
}

export function deriveProductionCadenceState({
  active,
  deployDue,
  productionRelation,
  productionHealthy,
  productionSha,
  mainSha,
} = {}) {
  if (active !== true) return 'LEGACY_PER_MERGE';
  if (productionHealthy !== true) return 'PRODUCTION_DRIFT';

  const relation = String(productionRelation || '').trim().toUpperCase();
  if (!['CURRENT_MAIN', 'ANCESTOR', 'PRE_EPOCH'].includes(relation)) return 'PRODUCTION_DRIFT';
  if (deployDue === true) return 'DEPLOYMENT_DUE';

  const production = String(productionSha || '').trim().toLowerCase();
  const currentMain = String(mainSha || '').trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(production) || !/^[0-9a-f]{40}$/.test(currentMain)) {
    return 'PRODUCTION_DRIFT';
  }
  return production === currentMain ? 'CONVERGED' : 'DEPLOYMENT_QUEUED';
}

export function extractDecisionStatus(bodyText) {
  return String(bodyText || '').match(
    /^> 🧭 \*\*Entscheidungsstatus: (READY_FOR_HUMAN_DECISION|EVIDENCE_PENDING|BLOCKED)\*\*\s*$/m,
  )?.[1] || null;
}

export function extractDecisionGates(bodyText) {
  const body = String(bodyText || '');
  const gates = {};
  for (const { key, label, aliases = [] } of PR_DECISION_GATES) {
    gates[key] = null;
    for (const candidate of [label, ...aliases]) {
      const escaped = candidate.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
      const match = body.match(new RegExp('^\\|\\s*' + escaped + '\\s*\\|\\s*(?:🟢|🟡|🔴)?\\s*(PASS|PENDING|BLOCKED)\\s*\\|[^\\n]*$', 'm'));
      if (match?.[1]) {
        gates[key] = match[1];
        break;
      }
    }
  }
  return gates;
}
