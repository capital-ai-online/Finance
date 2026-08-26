export const ORCHESTRATOR_CONFIG_POLICY = {
  concurrencyLimit: { min: 1, max: 10 },
  maxQueueSize: { min: 2, max: 30 },
  maxRequestsPerWindow: { min: 5, max: 100 },
} as const;

export type OrchestratorConfigField = keyof typeof ORCHESTRATOR_CONFIG_POLICY;

export type OrchestratorConfigPatch = Partial<Record<OrchestratorConfigField, number>>;

export interface OrchestratorConfigValidationIssue {
  field: string;
  code:
    | 'INVALID_BODY'
    | 'EMPTY_CONFIG'
    | 'UNKNOWN_FIELD'
    | 'INVALID_INTEGER'
    | 'OUT_OF_RANGE';
  message: string;
}

export type OrchestratorConfigValidationResult =
  | {
      ok: true;
      value: OrchestratorConfigPatch;
    }
  | {
      ok: false;
      code: 'ORCHESTRATOR_CONFIG_INVALID';
      issues: OrchestratorConfigValidationIssue[];
    };

const CONFIG_FIELDS = Object.keys(ORCHESTRATOR_CONFIG_POLICY) as OrchestratorConfigField[];

export function validateOrchestratorConfigPatch(input: unknown): OrchestratorConfigValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      ok: false,
      code: 'ORCHESTRATOR_CONFIG_INVALID',
      issues: [
        {
          field: '$body',
          code: 'INVALID_BODY',
          message: 'Konfiguration muss ein JSON-Objekt sein.',
        },
      ],
    };
  }

  const record = input as Record<string, unknown>;
  const issues: OrchestratorConfigValidationIssue[] = [];
  const value: OrchestratorConfigPatch = {};

  for (const key of Object.keys(record)) {
    if (!CONFIG_FIELDS.includes(key as OrchestratorConfigField)) {
      issues.push({
        field: key,
        code: 'UNKNOWN_FIELD',
        message: 'Unbekanntes Konfigurationsfeld.',
      });
    }
  }

  let supportedFieldCount = 0;

  for (const field of CONFIG_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(record, field)) continue;
    supportedFieldCount += 1;

    const candidate = record[field];
    const policy = ORCHESTRATOR_CONFIG_POLICY[field];

    if (
      typeof candidate !== 'number'
      || !Number.isFinite(candidate)
      || !Number.isInteger(candidate)
    ) {
      issues.push({
        field,
        code: 'INVALID_INTEGER',
        message: `${field} muss eine endliche Ganzzahl sein.`,
      });
      continue;
    }

    if (candidate < policy.min || candidate > policy.max) {
      issues.push({
        field,
        code: 'OUT_OF_RANGE',
        message: `${field} muss zwischen ${policy.min} und ${policy.max} liegen.`,
      });
      continue;
    }

    value[field] = candidate;
  }

  if (supportedFieldCount === 0 && issues.length === 0) {
    issues.push({
      field: '$body',
      code: 'EMPTY_CONFIG',
      message: 'Mindestens ein unterstütztes Konfigurationsfeld ist erforderlich.',
    });
  }

  if (issues.length > 0) {
    return {
      ok: false,
      code: 'ORCHESTRATOR_CONFIG_INVALID',
      issues,
    };
  }

  return { ok: true, value };
}
