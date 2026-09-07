export const PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION = 'provider-input-validation/1.0.0' as const;

export type ProviderInputCapability = 'snapshot' | 'history';

export type ProviderInputAdmissibility = 'ADMISSIBLE' | 'NON_ADMISSIBLE';

const ASSET_CLASSES = new Set([
  'crypto',
  'stock',
  'forex',
  'commodity',
  'index',
  'bond',
  'macro',
]);

export interface ProviderSnapshotInput {
  readonly providerId: string | null;
  readonly symbol: string | null;
  readonly assetClass: string | null;
  readonly price: number | null;
  readonly sourceTimestamp: string | null;
  readonly ingestedAt: string | null;
  readonly correlationId: string | null;
  readonly evidenceRef: string | null;
}

export interface ProviderHistoryInput {
  readonly providerId: string | null;
  readonly symbol: string | null;
  readonly assetClass: string | null;
  readonly receivedAt: string | null;
  readonly correlationId: string | null;
  readonly evidenceRef: string | null;
  readonly points: readonly { readonly timestamp: string | null; readonly close: number | null }[] | null;
}

export interface ProviderInputValidationResult {
  readonly contractVersion: typeof PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION;
  readonly capability: ProviderInputCapability;
  readonly admissibility: ProviderInputAdmissibility;
  readonly violations: readonly string[];
  readonly reason: string;
}

function present(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value: string | null | undefined): boolean {
  return present(value) && Number.isFinite(Date.parse(value as string));
}

function isPositiveFinite(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalizeSymbol(value: string | null | undefined): string {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

function identityViolations(input: {
  readonly providerId: string | null;
  readonly symbol: string | null;
  readonly assetClass: string | null;
  readonly correlationId: string | null;
}): string[] {
  const violations: string[] = [];
  if (!present(input.providerId)) violations.push('providerId');
  if (!normalizeSymbol(input.symbol)) violations.push('symbol');
  if (!present(input.assetClass) || !ASSET_CLASSES.has(String(input.assetClass).trim())) {
    violations.push('assetClass');
  }
  if (!present(input.correlationId)) violations.push('correlationId');
  return violations;
}

export function validateProviderSnapshotInput(
  input: ProviderSnapshotInput,
): ProviderInputValidationResult {
  const violations = identityViolations(input);
  if (!isPositiveFinite(input.price)) violations.push('price');
  if (!isIsoTimestamp(input.sourceTimestamp)) violations.push('sourceTimestamp');
  if (!isIsoTimestamp(input.ingestedAt)) violations.push('ingestedAt');
  if (!present(input.evidenceRef)) violations.push('evidenceRef');

  const admissible = violations.length === 0;
  return {
    contractVersion: PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION,
    capability: 'snapshot',
    admissibility: admissible ? 'ADMISSIBLE' : 'NON_ADMISSIBLE',
    violations,
    reason: admissible ? 'provider-snapshot-admissible' : `provider-snapshot-invalid:${violations.join(',')}`,
  };
}

export function validateProviderHistoryInput(
  input: ProviderHistoryInput,
): ProviderInputValidationResult {
  const violations = identityViolations(input);
  if (!isIsoTimestamp(input.receivedAt)) violations.push('receivedAt');
  if (!present(input.evidenceRef)) violations.push('evidenceRef');
  if (!Array.isArray(input.points) || input.points.length === 0) {
    violations.push('points');
  } else {
    const pointsValid = input.points.every((point) => isIsoTimestamp(point.timestamp) && isPositiveFinite(point.close));
    if (!pointsValid) violations.push('points');
  }

  const admissible = violations.length === 0;
  return {
    contractVersion: PROVIDER_INPUT_VALIDATION_CONTRACT_VERSION,
    capability: 'history',
    admissibility: admissible ? 'ADMISSIBLE' : 'NON_ADMISSIBLE',
    violations,
    reason: admissible ? 'provider-history-admissible' : `provider-history-invalid:${violations.join(',')}`,
  };
}
