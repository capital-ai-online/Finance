import { describe, expect, it } from 'vitest';

import { SELF_HEALING_CONTRACT_VERSION } from '../../src/platform/Supervisor/selfHealingContract';
import {
  SELF_HEALING_LEARNING_CONTRACT_VERSION,
  evaluateSelfHealingLearningPromotion,
  getSelfHealingLearningProcess,
} from '../../src/platform/Supervisor/selfHealingLearning';

describe('Self-Healing learning-only promotion gate', () => {
  it('keeps the productive remediation contract unchanged while learning is below 3/3', () => {
    expect(SELF_HEALING_CONTRACT_VERSION).toBe('self-healing-contract/1.2.0');

    const process = getSelfHealingLearningProcess('POST_MERGE_WORK_CLAIM_RELEASE_V1');
    expect(process).toMatchObject({
      schema: 'self-healing-learning/1.0.0',
      findingClassCandidate: 'REPOSITORY_TERMINAL_WORK_CLAIM_STALE',
      targetActionCandidate: 'RELEASE_TERMINAL_WORK_CLAIM',
      targetActionActivation: 'HELD',
      minimumPositiveValidations: 3,
    });
    expect(SELF_HEALING_LEARNING_CONTRACT_VERSION).toBe('self-healing-learning/1.0.0');
  });

  it('records one positive validation and does not promote early', () => {
    expect(evaluateSelfHealingLearningPromotion('POST_MERGE_WORK_CLAIM_RELEASE_V1')).toEqual({
      processId: 'POST_MERGE_WORK_CLAIM_RELEASE_V1',
      positiveValidations: 1,
      requiredPositiveValidations: 3,
      remainingPositiveValidations: 2,
      promotionEligible: false,
      targetActionActivation: 'HELD',
      requiresExplicitContractPromotion: true,
    });
  });

  it('requires three distinct positive validation ids and still keeps the target action held', () => {
    const process = getSelfHealingLearningProcess('POST_MERGE_WORK_CLAIM_RELEASE_V1');
    const [first] = process.validations;
    const result = evaluateSelfHealingLearningPromotion(
      'POST_MERGE_WORK_CLAIM_RELEASE_V1',
      [
        first,
        { ...first, id: 'POST_MERGE_WORK_CLAIM_RELEASE_V1-VALIDATION-002' },
        { ...first, id: 'POST_MERGE_WORK_CLAIM_RELEASE_V1-VALIDATION-003' },
        { ...first, id: 'POST_MERGE_WORK_CLAIM_RELEASE_V1-VALIDATION-003' },
      ],
    );

    expect(result).toEqual({
      processId: 'POST_MERGE_WORK_CLAIM_RELEASE_V1',
      positiveValidations: 3,
      requiredPositiveValidations: 3,
      remainingPositiveValidations: 0,
      promotionEligible: true,
      targetActionActivation: 'HELD',
      requiresExplicitContractPromotion: true,
    });
  });
});
