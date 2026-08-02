import { PROMPT_REGISTRY, type PromptRegistryEntry } from './aiUsageTracker';

export type AiProvider = 'anthropic' | 'openai' | 'gemini';
export type AiRiskClass = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AiModelRegistryEntry {
  id: string;
  provider: AiProvider;
  purpose: string;
  allowedForFinancialReasoning: boolean;
  riskClass: AiRiskClass;
  lifecycle: 'active' | 'fallback' | 'restricted';
}

/**
 * Governance inventory describes model roles, not commercial/version claims. Concrete model
 * names remain environment/provider configuration and are captured at runtime in attribution.
 */
export const AI_MODEL_REGISTRY: Record<string, AiModelRegistryEntry> = {
  anthropic: {
    id: 'anthropic', provider: 'anthropic', purpose: 'Primary structured/free-text reasoning provider',
    allowedForFinancialReasoning: true, riskClass: 'HIGH', lifecycle: 'active',
  },
  openai: {
    id: 'openai', provider: 'openai', purpose: 'Secondary reasoning provider and primary embedding provider when configured',
    allowedForFinancialReasoning: true, riskClass: 'HIGH', lifecycle: 'fallback',
  },
  gemini: {
    id: 'gemini', provider: 'gemini', purpose: 'Fallback reasoning plus Gemini-specific search-grounding/vision capabilities',
    allowedForFinancialReasoning: true, riskClass: 'HIGH', lifecycle: 'fallback',
  },
};

export interface AiEvaluationRecord {
  evaluationId: string;
  timestamp: string;
  promptId: string;
  promptVersion: string;
  modelProvider: AiProvider;
  model: string;
  requestId?: string;
  evidenceIds?: string[];
  checks: {
    schemaValid?: boolean;
    grounded?: boolean;
    citationComplete?: boolean;
    humanReviewed?: boolean;
  };
  outcome: 'PASS' | 'WARN' | 'FAIL';
  notes?: string;
}

const MAX_EVALUATIONS = 2000;
const evaluations: AiEvaluationRecord[] = [];

export function getPromptGovernanceEntry(promptId: string): PromptRegistryEntry | undefined {
  return PROMPT_REGISTRY[promptId];
}

export function validateAiInvocation(input: {
  promptId: string;
  provider: string;
}): { valid: boolean; reasons: string[]; prompt?: PromptRegistryEntry; model?: AiModelRegistryEntry } {
  const reasons: string[] = [];
  const prompt = getPromptGovernanceEntry(input.promptId);
  if (!prompt) reasons.push(`Prompt '${input.promptId}' is not registered.`);
  const normalizedProvider = input.provider.split(':')[0].toLowerCase();
  const model = AI_MODEL_REGISTRY[normalizedProvider];
  if (!model) reasons.push(`Provider '${normalizedProvider}' is not registered.`);
  else if (!model.allowedForFinancialReasoning) reasons.push(`Provider '${normalizedProvider}' is not approved for financial reasoning.`);
  return { valid: reasons.length === 0, reasons, prompt, model };
}

export function recordAiEvaluation(input: Omit<AiEvaluationRecord, 'evaluationId' | 'timestamp' | 'outcome'> & {
  evaluationId?: string;
  timestamp?: string;
  outcome?: AiEvaluationRecord['outcome'];
}): AiEvaluationRecord {
  const governance = validateAiInvocation({ promptId: input.promptId, provider: input.modelProvider });
  const checks = input.checks ?? {};
  const negative = [checks.schemaValid, checks.grounded, checks.citationComplete].some(value => value === false);
  const defaultOutcome: AiEvaluationRecord['outcome'] = !governance.valid || negative ? 'FAIL' : 'PASS';
  const record: AiEvaluationRecord = {
    evaluationId: input.evaluationId ?? `AIEVAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: input.timestamp ?? new Date().toISOString(),
    promptId: input.promptId,
    promptVersion: input.promptVersion,
    modelProvider: input.modelProvider,
    model: input.model,
    requestId: input.requestId,
    evidenceIds: input.evidenceIds ? [...input.evidenceIds] : undefined,
    checks: { ...checks },
    outcome: input.outcome ?? defaultOutcome,
    notes: input.notes,
  };
  evaluations.push(record);
  if (evaluations.length > MAX_EVALUATIONS) evaluations.shift();
  return { ...record, checks: { ...record.checks }, evidenceIds: record.evidenceIds ? [...record.evidenceIds] : undefined };
}

export function getAiEvaluations(limit = 100): AiEvaluationRecord[] {
  return evaluations.slice(-Math.max(0, limit)).reverse().map(record => ({
    ...record,
    checks: { ...record.checks },
    evidenceIds: record.evidenceIds ? [...record.evidenceIds] : undefined,
  }));
}

export function getAiGovernanceInventory() {
  return {
    models: Object.values(AI_MODEL_REGISTRY).map(model => ({ ...model })),
    prompts: Object.values(PROMPT_REGISTRY).map(prompt => ({ ...prompt })),
    recentEvaluations: getAiEvaluations(),
  };
}

export function resetAiEvaluations(): void {
  evaluations.length = 0;
}
