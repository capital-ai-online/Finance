/**
 * Learning-only Self-Healing evidence.
 *
 * This registry deliberately does not mutate or extend the productive
 * self-healing remediation contract. Promotion requires three distinct
 * positive validations plus an explicit later contract change.
 */

export const SELF_HEALING_LEARNING_CONTRACT_VERSION = 'self-healing-learning/1.0.0' as const;
export const SELF_HEALING_MIN_POSITIVE_VALIDATIONS = 3 as const;

export type SelfHealingLearningProcessId = 'POST_MERGE_WORK_CLAIM_RELEASE_V1';
export type SelfHealingLearningValidationResult = 'POSITIVE' | 'NEGATIVE';

export interface SelfHealingLearningValidation {
  id: string;
  result: SelfHealingLearningValidationResult;
  observedAt: string;
  evidenceRefs: readonly string[];
  note: string;
}

export interface SelfHealingLearningProcess {
  schema: typeof SELF_HEALING_LEARNING_CONTRACT_VERSION;
  id: SelfHealingLearningProcessId;
  findingClassCandidate: 'REPOSITORY_TERMINAL_WORK_CLAIM_STALE';
  targetActionCandidate: 'RELEASE_TERMINAL_WORK_CLAIM';
  targetActionActivation: 'HELD';
  minimumPositiveValidations: typeof SELF_HEALING_MIN_POSITIVE_VALIDATIONS;
  steps: readonly string[];
  validations: readonly SelfHealingLearningValidation[];
}

const PROCESSES: Readonly<Record<SelfHealingLearningProcessId, SelfHealingLearningProcess>> = Object.freeze({
  POST_MERGE_WORK_CLAIM_RELEASE_V1: Object.freeze({
    schema: SELF_HEALING_LEARNING_CONTRACT_VERSION,
    id: 'POST_MERGE_WORK_CLAIM_RELEASE_V1',
    findingClassCandidate: 'REPOSITORY_TERMINAL_WORK_CLAIM_STALE',
    targetActionCandidate: 'RELEASE_TERMINAL_WORK_CLAIM',
    targetActionActivation: 'HELD',
    minimumPositiveValidations: SELF_HEALING_MIN_POSITIVE_VALIDATIONS,
    steps: Object.freeze([
      'READ_CURRENT_MAIN',
      'CORRELATE_TERMINAL_PR_AND_WORK_CLAIM',
      'VERIFY_REQUIRED_CHECKS_AND_POST_MERGE_EVIDENCE',
      'PREPARE_BOUNDED_RELEASE_STATUS_RELEASED_EXCLUSIVE_FALSE',
      'VERIFY_RELEASE_READBACK',
    ]),
    validations: Object.freeze([
      Object.freeze({
        id: 'POST_MERGE_WORK_CLAIM_RELEASE_V1-VALIDATION-001',
        result: 'POSITIVE' as const,
        observedAt: '2026-09-24T20:35:31.935Z',
        evidenceRefs: Object.freeze([
          'github:pr/1437@merge:ea9fafc03aa9e05ee9e2f801da09c50392cd1ecc',
          'github:pr/1439@head:62bb702b78e19deb2e574812fd40bc2059ceffc9',
          'github:checks/62bb702b78e19deb2e574812fd40bc2059ceffc9:required-success',
          'github:pr/1439:post-merge-render-readback:dep-daqog5g473hc73bucltg',
        ]),
        note: 'First positive learning validation only; no productive remediation action is activated.',
      }),
    ]),
  }),
});

export interface SelfHealingLearningPromotion {
  processId: SelfHealingLearningProcessId;
  positiveValidations: number;
  requiredPositiveValidations: number;
  remainingPositiveValidations: number;
  promotionEligible: boolean;
  targetActionActivation: 'HELD';
  requiresExplicitContractPromotion: true;
}

export function getSelfHealingLearningProcess(id: SelfHealingLearningProcessId): SelfHealingLearningProcess {
  const item = PROCESSES[id];
  return {
    ...item,
    steps: [...item.steps],
    validations: item.validations.map((validation) => ({
      ...validation,
      evidenceRefs: [...validation.evidenceRefs],
    })),
  };
}

export function evaluateSelfHealingLearningPromotion(
  id: SelfHealingLearningProcessId,
  validations: readonly SelfHealingLearningValidation[] = PROCESSES[id].validations,
): SelfHealingLearningPromotion {
  const process = PROCESSES[id];
  const positiveIds = new Set(
    validations
      .filter((validation) => validation.result === 'POSITIVE')
      .map((validation) => validation.id),
  );
  const positiveValidations = positiveIds.size;
  const remainingPositiveValidations = Math.max(
    0,
    process.minimumPositiveValidations - positiveValidations,
  );

  return {
    processId: id,
    positiveValidations,
    requiredPositiveValidations: process.minimumPositiveValidations,
    remainingPositiveValidations,
    promotionEligible: positiveValidations >= process.minimumPositiveValidations,
    targetActionActivation: 'HELD',
    requiresExplicitContractPromotion: true,
  };
}
