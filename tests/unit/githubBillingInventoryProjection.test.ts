import { describe, expect, it } from 'vitest';
import {
  projectBudgetInventoryEvidence,
  projectCostCenterInventoryEvidence,
  projectUsageInventoryEvidence,
} from '../../scripts/operations/githubBillingInventoryProjection.mjs';

describe('private GitHub billing inventory projection', () => {
  it('projects budget metadata without ids, names, or amounts', () => {
    const result = projectBudgetInventoryEvidence({
      budgets: [
        {
          id: 'budget-secret-id',
          budgetType: 'ProductPricing',
          scope: 'enterprise',
          entityName: 'Sensitive Name',
          amount: 123.45,
          preventFurtherUsage: false,
          alerting: { willAlert: true },
        },
      ],
    });

    expect(result).toEqual({
      budgetCount: 1,
      budgetTypes: ['ProductPricing'],
      scopes: ['enterprise'],
      alertingEnabledCount: 1,
      preventFurtherUsageCount: 0,
    });
    expect(JSON.stringify(result)).not.toContain('budget-secret-id');
    expect(JSON.stringify(result)).not.toContain('Sensitive Name');
    expect(JSON.stringify(result)).not.toContain('123.45');
  });

  it('projects usage dimensions without prices or billed amounts', () => {
    const result = projectUsageInventoryEvidence({
      timePeriod: { year: 2026, month: 9, day: null },
      usageItems: [
        {
          product: 'Actions',
          sku: 'actions_linux',
          unitType: 'minutes',
          pricePerUnit: 0.008,
          grossQuantity: 100,
          grossAmount: 0.8,
          discountQuantity: 20,
          discountAmount: 0.16,
          netQuantity: 80,
          netAmount: 0.64,
        },
        {
          product: 'Copilot',
          sku: 'copilot_premium_request',
          unitType: 'requests',
          netQuantity: 0,
          netAmount: 0,
        },
      ],
    });

    expect(result).toEqual({
      timePeriod: { year: 2026, month: 9, day: null },
      usageItemCount: 2,
      products: ['Actions', 'Copilot'],
      skus: ['actions_linux', 'copilot_premium_request'],
      unitTypes: ['minutes', 'requests'],
      hasUsage: true,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('0.008');
    expect(serialized).not.toContain('0.64');
    expect(serialized).not.toContain('0.8');
  });

  it('projects cost-center inventory without ids or names', () => {
    const result = projectCostCenterInventoryEvidence([
      {
        id: 'cc-sensitive-id',
        name: 'Finance Team',
        state: 'active',
        aiCreditPoolEnabled: false,
      },
      {
        id: 'cc-sensitive-id-2',
        name: 'Engineering',
        state: 'active',
        aiCreditPoolEnabled: true,
      },
    ]);

    expect(result).toEqual({
      costCenterCount: 2,
      states: ['active'],
      aiCreditPoolEnabledCount: 1,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('cc-sensitive-id');
    expect(serialized).not.toContain('Finance Team');
    expect(serialized).not.toContain('Engineering');
  });

  it('represents an unconfigured cost-center inventory as an explicit zero count', () => {
    expect(projectCostCenterInventoryEvidence([])).toEqual({
      costCenterCount: 0,
      states: [],
      aiCreditPoolEnabledCount: 0,
    });
  });
});
