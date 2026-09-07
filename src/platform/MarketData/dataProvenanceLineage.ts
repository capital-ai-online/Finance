export const DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION = 'data-provenance-lineage/1.0.0' as const;

export const REQUIRED_PROVENANCE_FIELDS = [
  'assetId',
  'providerId',
  'capability',
  'field',
  'evidenceRef',
  'observedAt',
  'retrievedAt',
  'correlationId',
] as const;

export type RequiredProvenanceField = typeof REQUIRED_PROVENANCE_FIELDS[number];

export interface DataProvenanceLineage {
  readonly contractVersion: typeof DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION;
  readonly assetId: string;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly capability: string;
  readonly field: string;
  readonly evidenceRef: string | null;
  readonly observedAt: string | null;
  readonly retrievedAt: string | null;
  readonly correlationId: string;
}

export interface ProvenanceLineageEvaluation {
  readonly contractVersion: typeof DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION;
  readonly complete: boolean;
  readonly missingFields: readonly RequiredProvenanceField[];
  readonly survivesHandoff: boolean;
  readonly reason: string;
}

function present(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value: string | null | undefined): boolean {
  return present(value) && Number.isFinite(Date.parse(value as string));
}

export function evaluateProvenanceLineage(
  lineage: DataProvenanceLineage,
): ProvenanceLineageEvaluation {
  const missingFields: RequiredProvenanceField[] = [];

  if (!present(lineage.assetId)) missingFields.push('assetId');
  if (!present(lineage.providerId)) missingFields.push('providerId');
  if (!present(lineage.capability)) missingFields.push('capability');
  if (!present(lineage.field)) missingFields.push('field');
  if (!present(lineage.evidenceRef)) missingFields.push('evidenceRef');
  if (!isIsoTimestamp(lineage.observedAt)) missingFields.push('observedAt');
  if (!isIsoTimestamp(lineage.retrievedAt)) missingFields.push('retrievedAt');
  if (!present(lineage.correlationId)) missingFields.push('correlationId');

  const complete = missingFields.length === 0
    && lineage.contractVersion === DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION;

  return {
    contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
    complete,
    missingFields,
    survivesHandoff: complete,
    reason: complete
      ? 'lineage-complete'
      : `lineage-incomplete:${missingFields.join(',') || 'contract-mismatch'}`,
  };
}

export function lineageSurvivesHandoff(
  produced: DataProvenanceLineage,
  consumed: DataProvenanceLineage,
): ProvenanceLineageEvaluation {
  const producedEval = evaluateProvenanceLineage(produced);
  if (!producedEval.complete) return producedEval;

  const consumedEval = evaluateProvenanceLineage(consumed);
  if (!consumedEval.complete) {
    return {
      ...consumedEval,
      survivesHandoff: false,
      reason: `handoff-dropped-fields:${consumedEval.missingFields.join(',')}`,
    };
  }

  const mutated = REQUIRED_PROVENANCE_FIELDS.filter((field) => {
    const left = String(produced[field] ?? '').trim();
    const right = String(consumed[field] ?? '').trim();
    return left !== right;
  });

  if (mutated.length > 0) {
    return {
      contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
      complete: true,
      missingFields: [],
      survivesHandoff: false,
      reason: `handoff-mutated-fields:${mutated.join(',')}`,
    };
  }

  return {
    contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
    complete: true,
    missingFields: [],
    survivesHandoff: true,
    reason: 'lineage-survived-handoff',
  };
}
