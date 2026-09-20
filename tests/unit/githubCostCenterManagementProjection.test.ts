import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ENTERPRISE_COST_CENTER_NAME,
  OWNER_ADDITIONAL_COST_TARGET_EUR,
  projectGitHubCostCenterManagement,
} from '../../scripts/operations/githubCostCenterManagementProjection.mjs';

describe('GitHub Cost Center management projection', () => {
  it('separates GHEC baseline, included Actions, Security spend and Cost Center attribution', () => {
    const result = projectGitHubCostCenterManagement({
      enterpriseUsageSummary: {
        timePeriod: { year: 2026, month: 9, day: null },
        usageItems: [
          {
            product: 'GHEC',
            sku: 'ghec_licenses',
            grossAmount: 7,
            discountAmount: 0,
            netAmount: 7,
          },
          {
            product: 'Actions',
            sku: 'actions_linux',
            grossAmount: 20,
            discountAmount: 20,
            netAmount: 0,
          },
          {
            product: 'GHAS',
            sku: 'ghas_code_security_licenses',
            grossAmount: 6,
            discountAmount: 0,
            netAmount: 6,
          },
        ],
      },
      costCenterUsageSummary: {
        timePeriod: { year: 2026, month: 9, day: null },
        usageItems: [
          {
            product: 'GHAS',
            sku: 'ghas_code_security_licenses',
            grossAmount: 6,
            discountAmount: 0,
            netAmount: 6,
          },
        ],
      },
      costCenters: [{
        id: 'cc-enterprise',
        name: 'Enterprise',
        state: 'active',
        aiCreditPoolEnabled: false,
      }],
      budgets: {
        budgets: [{
          id: 'budget-1',
          scope: 'cost_center',
          entityName: 'cc-enterprise',
          amount: 5,
          preventFurtherUsage: true,
          alerting: { willAlert: true, recipients: ['SvenKulessa'] },
        }],
      },
    });

    expect(result.status).toBe('PASS');
    expect(result.canonicalCostCenter.expectedName).toBe(CANONICAL_ENTERPRISE_COST_CENTER_NAME);
    expect(result.canonicalCostCenter.state).toBe('ACTIVE');
    expect(result.totals.enterpriseNet).toBe(13);
    expect(result.totals.costCenterNet).toBe(6);
    expect(result.totals.enterpriseOnlyNet).toBe(7);
    expect(result.totals.expectedEnterpriseLicenseNet).toBe(7);
    expect(result.totals.includedOrDiscountedGross).toBe(20);
    expect(result.totals.additionalNet).toBe(6);
    expect(result.totals.securityNet).toBe(6);
    expect(result.costCenterBudget.configuredCount).toBe(1);
    expect(result.costCenterBudget.hardStopBudgetCount).toBe(1);
    expect(result.costCenterBudget.alertingBudgetCount).toBe(1);
    expect(result.ownerPolicy.additionalMonthlyCostTarget).toBe(OWNER_ADDITIONAL_COST_TARGET_EUR);
    expect(result.ownerPolicy.currency).toBe('EUR');
    expect(result.decisionState).toBe('COST_REVIEW_REQUIRED');
    expect(result.recommendations.map((item) => item.code)).toContain('TRACE_SECURITY_COST_ORIGIN');
    expect(result.providerMutationPerformed).toBe(false);
  });

  it('marks a missing canonical Cost Center as setup required', () => {
    const result = projectGitHubCostCenterManagement({
      enterpriseUsageSummary: {
        timePeriod: { year: 2026, month: 10, day: null },
        usageItems: [{ product: 'GHEC', sku: 'ghec_licenses', netAmount: 21 }],
      },
      costCenters: [],
      budgets: { budgets: [] },
    });

    expect(result.canonicalCostCenter.state).toBe('NOT_CONFIGURED');
    expect(result.decisionState).toBe('SETUP_REQUIRED');
    expect(result.recommendations[0].code).toBe('CREATE_CANONICAL_COST_CENTER');
  });

  it('flags an active Cost Center without a provider budget', () => {
    const result = projectGitHubCostCenterManagement({
      enterpriseUsageSummary: {
        timePeriod: { year: 2026, month: 10, day: null },
        usageItems: [{ product: 'GHEC', sku: 'ghec_licenses', netAmount: 21 }],
      },
      costCenterUsageSummary: {
        timePeriod: { year: 2026, month: 10, day: null },
        usageItems: [],
      },
      costCenters: [{
        id: 'cc-enterprise',
        name: 'Enterprise',
        state: 'active',
        aiCreditPoolEnabled: false,
      }],
      budgets: { budgets: [] },
    });

    expect(result.decisionState).toBe('BUDGET_CONFIGURATION_REQUIRED');
    expect(result.recommendations.map((item) => item.code)).toContain('CONFIGURE_COST_CENTER_BUDGET');
    expect(result.recommendations.map((item) => item.code)).toContain('REVIEW_ENTERPRISE_ONLY_SPEND');
  });

  it('fails management classification upward when an unknown positive SKU appears', () => {
    const result = projectGitHubCostCenterManagement({
      enterpriseUsageSummary: {
        timePeriod: { year: 2026, month: 10, day: null },
        usageItems: [{
          product: 'Future GitHub Product',
          sku: 'future_metered_unit',
          grossAmount: 1.25,
          discountAmount: 0,
          netAmount: 1.25,
        }],
      },
      costCenters: [{
        id: 'cc-enterprise',
        name: 'Enterprise',
        state: 'active',
        aiCreditPoolEnabled: false,
      }],
      costCenterUsageSummary: {
        timePeriod: { year: 2026, month: 10, day: null },
        usageItems: [{
          product: 'Future GitHub Product',
          sku: 'future_metered_unit',
          netAmount: 1.25,
        }],
      },
      budgets: {
        budgets: [{
          id: 'budget-1',
          scope: 'cost_center',
          entityName: 'cc-enterprise',
          amount: 5,
          preventFurtherUsage: true,
          alerting: { willAlert: true },
        }],
      },
    });

    expect(result.totals.otherNet).toBe(1.25);
    expect(result.decisionState).toBe('COST_REVIEW_REQUIRED');
    expect(result.recommendations.map((item) => item.code)).toContain('CLASSIFY_UNKNOWN_BILLING_SKU');
  });
});
