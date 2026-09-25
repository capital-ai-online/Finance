import type {
  AnalysisConnectionContract,
  AnalysisContractStatus,
} from '../../../platform/Scoring/AnalysisConnectionRegistry';

export type WorkflowValidationState = 'PASS' | 'WARN' | 'BLOCKED';

export interface WorkflowValidationCheck {
  readonly id: string;
  readonly label: string;
  readonly state: WorkflowValidationState;
  readonly detail: string;
}

export interface WorkflowBenchmarkResult {
  readonly iterations: number;
  readonly localValidationMs: number;
  readonly averageValidationMs: number;
  readonly architectureFitScore: number;
  readonly passedChecks: number;
  readonly totalChecks: number;
  readonly providerLatencyMs: null;
  readonly providerLatencyStatus: 'NOT_MEASURED';
}

const INGRESS_PATTERN = /(provider|adapter|registry|marketdata|evidence|discovery|target)/i;
const EVIDENCE_PATTERN = /(evidence|provenance|freshness|quality|validated)/i;
const SCORING_PATTERN = /(scor|model|dispatch|evaluation|allocat|ranking|regime|resolver)/i;
const CANONICAL_PATTERN = /(canonical|dispatcher)/i;
const UI_PATTERN = /\bui\b|workbench|dashboard|board|screen|projection/i;

function firstIndex(steps: readonly string[], pattern: RegExp): number {
  return steps.findIndex((step) => pattern.test(step));
}

function lastIndex(steps: readonly string[], pattern: RegExp): number {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (pattern.test(steps[index])) return index;
  }
  return -1;
}

function productiveStatus(status: AnalysisContractStatus): boolean {
  return status === 'CANONICAL';
}

export function buildDefaultWorkflow(contract: AnalysisConnectionContract): string[] {
  return [...contract.bindingSequence];
}

export function validateWorkflow(
  contract: AnalysisConnectionContract,
  steps: readonly string[],
): readonly WorkflowValidationCheck[] {
  const ingressIndex = firstIndex(steps, INGRESS_PATTERN);
  const evidenceIndex = firstIndex(steps, EVIDENCE_PATTERN);
  const scoringIndex = firstIndex(steps, SCORING_PATTERN);
  const canonicalIndex = firstIndex(steps, CANONICAL_PATTERN);
  const uiIndex = lastIndex(steps, UI_PATTERN);

  const checks: WorkflowValidationCheck[] = [
    {
      id: 'ingress',
      label: '1 · Ingress / Provider',
      state: ingressIndex >= 0 ? 'PASS' : 'BLOCKED',
      detail: ingressIndex >= 0
        ? 'Ein Provider-, Adapter-, Evidence- oder Discovery-Einstieg ist vorhanden.'
        : 'Kein nachvollziehbarer Daten-/Evidence-Einstieg vorhanden.',
    },
    {
      id: 'evidence-before-evaluation',
      label: '2 · Evidence vor Evaluation',
      state: evidenceIndex >= 0 && scoringIndex >= 0 && evidenceIndex < scoringIndex
        ? 'PASS'
        : contract.kind === 'RANKING' || contract.kind === 'PORTFOLIO'
          ? 'WARN'
          : 'BLOCKED',
      detail: evidenceIndex >= 0 && scoringIndex >= 0 && evidenceIndex < scoringIndex
        ? 'Evidence/DQ liegt vor der Analyse-/Scoring-Stufe.'
        : 'Evidence-/DQ-Reihenfolge ist nicht eindeutig vor der Evaluation belegt.',
    },
    {
      id: 'canonical-boundary',
      label: '3 · Canonical Boundary',
      state: productiveStatus(contract.status)
        ? canonicalIndex >= 0 || contract.kind === 'PORTFOLIO'
          ? 'PASS'
          : 'BLOCKED'
        : 'WARN',
      detail: productiveStatus(contract.status)
        ? canonicalIndex >= 0 || contract.kind === 'PORTFOLIO'
          ? 'Produktiver Vertrag führt über die kanonische Dispatch-/Output-Grenze.'
          : 'Produktiver Vertrag benötigt eine kanonische Dispatch-/Output-Grenze.'
        : 'Nicht-kanonischer Vertrag darf keine produktive Canonical-Promotion ableiten.',
    },
    {
      id: 'ui-downstream',
      label: '4 · UI nur downstream',
      state: uiIndex >= 0 && (scoringIndex < 0 || uiIndex > scoringIndex) ? 'PASS' : 'BLOCKED',
      detail: uiIndex >= 0 && (scoringIndex < 0 || uiIndex > scoringIndex)
        ? 'Die UI konsumiert Downstream-Ausgaben; sie definiert keine Scoring-Wahrheit.'
        : 'UI fehlt oder liegt vor der Analyse-/Scoring-Stufe.',
    },
    {
      id: 'status-gate',
      label: '5 · Contract Status Gate',
      state: contract.status === 'DISABLED' || contract.status === 'BLOCKED'
        ? 'BLOCKED'
        : contract.status === 'RESEARCH_ONLY' || contract.status === 'CONTEXT_ONLY' || contract.status === 'COMPATIBILITY_ONLY'
          ? 'WARN'
          : 'PASS',
      detail: contract.status === 'CANONICAL'
        ? 'Kanonischer Vertrag ist grundsätzlich produktiv zulässig; Evidence-Gates bleiben bindend.'
        : contract.status === 'COMPATIBILITY_ONLY'
          ? 'Compatibility-Pfad darf weiterlaufen, ist aber noch nicht die kanonische Zielarchitektur.'
          : contract.status === 'BLOCKED'
            ? 'Dieser bestehende Pfad enthält nicht freigegebene/synthetische Semantik oder eine fehlende Authority und bleibt blockiert.'
            : contract.status === 'DISABLED'
              ? 'Dieser Vertrag ist ausdrücklich deaktiviert und nicht produktiv ausführbar.'
              : 'Dieser Vertrag ist Research/Context only und darf keinen produktiven Score vortäuschen.',
    },
  ];

  return Object.freeze(checks);
}

export function architectureFitScore(
  contract: AnalysisConnectionContract,
  checks: readonly WorkflowValidationCheck[],
): number {
  const total = Math.max(1, checks.length);
  const passEquivalent = checks.reduce((sum, check) => {
    if (check.state === 'PASS') return sum + 1;
    if (check.state === 'WARN') return sum + 0.5;
    return sum;
  }, 0);

  const evidence = contract.benchmark.evidenceStrength / 5;
  const completeness = passEquivalent / total;
  const deployability = contract.status === 'CANONICAL'
    ? 1
    : contract.status === 'COMPATIBILITY_ONLY'
      ? 0.65
      : contract.status === 'RESEARCH_ONLY' || contract.status === 'CONTEXT_ONLY'
        ? 0.5
        : 0;
  const simplicity = (6 - contract.benchmark.integrationComplexity) / 5;

  return Math.round((evidence * 0.40 + completeness * 0.25 + deployability * 0.20 + simplicity * 0.15) * 100);
}

export function benchmarkWorkflow(
  contract: AnalysisConnectionContract,
  steps: readonly string[],
  iterations = 1_000,
  now: () => number = () => performance.now(),
): WorkflowBenchmarkResult {
  const safeIterations = Math.max(1, Math.min(10_000, Math.trunc(iterations)));
  const startedAt = now();
  let checks = validateWorkflow(contract, steps);

  for (let index = 1; index < safeIterations; index += 1) {
    checks = validateWorkflow(contract, steps);
  }

  const endedAt = now();
  const localValidationMs = Math.max(0, endedAt - startedAt);
  const passedChecks = checks.filter((check) => check.state === 'PASS').length;

  return Object.freeze({
    iterations: safeIterations,
    localValidationMs: Number(localValidationMs.toFixed(3)),
    averageValidationMs: Number((localValidationMs / safeIterations).toFixed(6)),
    architectureFitScore: architectureFitScore(contract, checks),
    passedChecks,
    totalChecks: checks.length,
    providerLatencyMs: null,
    providerLatencyStatus: 'NOT_MEASURED',
  });
}
