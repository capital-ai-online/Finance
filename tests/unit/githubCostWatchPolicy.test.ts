import { describe, expect, it } from 'vitest';
import { buildGitHubCostWatchReport } from '../../scripts/operations/githubCostWatchPolicy.mjs';

const enterpriseUsage = {
  usageItems: [
    { product: 'GHEC', sku: 'ghec_licenses', unitType: 'user-months', grossAmount: 7, discountAmount: 0, netAmount: 7 },
    { product: 'Actions', sku: 'actions_linux', unitType: 'minutes', grossAmount: 20, discountAmount: 20, netAmount: 0 },
    { product: 'GHAS', sku: 'ghas_code_security_licenses', unitType: 'user-months', grossAmount: 6, discountAmount: 0, netAmount: 6 },
  ],
};

describe('GitHub cost watch policy', () => {
  it('excludes Enterprise GHEC baseline but alerts every other positive net cost', () => {
    const report = buildGitHubCostWatchReport({
      mode: 'monitor',
      generatedAt: '2026-10-01T00:15:00.000Z',
      enterprise: 'capital-ai-online',
      username: 'SvenKulessa',
      enterpriseUsage,
      organizationUsageDetail: {
        usageItems: [{
          date: '2026-10-01',
          product: 'GHAS',
          sku: 'GitHub Code Security',
          unitType: 'user-months',
          netAmount: 6,
          organizationName: 'capital-ai-online',
          repositoryName: 'capital-ai-online/Finance',
        }],
      },
      personalUsage: {
        usageItems: [
          { product: 'GitHub Pro', sku: 'github_pro', unitType: 'months', grossAmount: 4, discountAmount: 0, netAmount: 4 },
        ],
      },
      personalUsageDetail: {
        usageItems: [{
          date: '2026-10-01',
          product: 'GitHub Pro',
          sku: 'GitHub Pro',
          unitType: 'months',
          netAmount: 4,
          repositoryName: 'SvenKulessa/personal-repo',
        }],
      },
      organizationCoverage: { status: 'PASS', reason: null },
      personalCoverage: { status: 'PASS', reason: null },
    });

    expect(report.status).toBe('PASS');
    expect(report.totals.enterpriseNet).toBe(13);
    expect(report.totals.personalNet).toBe(4);
    expect(report.totals.globalNet).toBe(17);
    expect(report.totals.expectedEnterpriseLicenseNet).toBe(7);
    expect(report.totals.additionalNet).toBe(10);
    expect(report.alertRows.map((row) => row.sku)).toEqual([
      'ghas_code_security_licenses',
      'github_pro',
    ]);
    expect(report.emailRequired).toBe(true);
    expect(report.alertDetailRows.map((row) => row.repositoryName)).toEqual([
      'capital-ai-online/Finance',
      'SvenKulessa/personal-repo',
    ]);
  });

  it('does not change alert fingerprint when only the running amount increases', () => {
    const base = buildGitHubCostWatchReport({
      mode: 'monitor',
      generatedAt: '2026-10-01T00:15:00.000Z',
      enterprise: 'capital-ai-online',
      username: 'SvenKulessa',
      enterpriseUsage: {
        usageItems: [{ product: 'GHAS', sku: 'ghas_secret_protection_licenses', unitType: 'user-months', netAmount: 1 }],
      },
      personalUsage: { usageItems: [] },
      personalCoverage: { status: 'PASS', reason: null },
    });
    const increased = buildGitHubCostWatchReport({
      mode: 'monitor',
      generatedAt: '2026-10-01T00:30:00.000Z',
      enterprise: 'capital-ai-online',
      username: 'SvenKulessa',
      enterpriseUsage: {
        usageItems: [{ product: 'GHAS', sku: 'ghas_secret_protection_licenses', unitType: 'user-months', netAmount: 3 }],
      },
      personalUsage: { usageItems: [] },
      personalCoverage: { status: 'PASS', reason: null },
    });

    expect(base.alertFingerprint).toBe(increased.alertFingerprint);
  });

  it('changes alert fingerprint when the same billed SKU appears in a new repository', () => {
    const baseInput = {
      mode: 'monitor',
      generatedAt: '2026-10-01T00:15:00.000Z',
      enterprise: 'capital-ai-online',
      username: 'SvenKulessa',
      enterpriseUsage: {
        usageItems: [{ product: 'Actions', sku: 'actions_linux', unitType: 'minutes', netAmount: 1 }],
      },
      personalUsage: { usageItems: [] },
      personalCoverage: { status: 'PASS', reason: null },
      organizationCoverage: { status: 'PASS', reason: null },
    };

    const finance = buildGitHubCostWatchReport({
      ...baseInput,
      organizationUsageDetail: {
        usageItems: [{
          date: '2026-10-01',
          product: 'Actions',
          sku: 'Actions Linux',
          unitType: 'minutes',
          netAmount: 1,
          organizationName: 'capital-ai-online',
          repositoryName: 'capital-ai-online/Finance',
        }],
      },
    });
    const secondRepo = buildGitHubCostWatchReport({
      ...baseInput,
      organizationUsageDetail: {
        usageItems: [
          {
            date: '2026-10-01',
            product: 'Actions',
            sku: 'Actions Linux',
            unitType: 'minutes',
            netAmount: 1,
            organizationName: 'capital-ai-online',
            repositoryName: 'capital-ai-online/Finance',
          },
          {
            date: '2026-10-02',
            product: 'Actions',
            sku: 'Actions Linux',
            unitType: 'minutes',
            netAmount: 0.5,
            organizationName: 'capital-ai-online',
            repositoryName: 'capital-ai-online/second-repo',
          },
        ],
      },
    });

    expect(finance.alertFingerprint).not.toBe(secondRepo.alertFingerprint);
  });

  it('forces an email when personal billing coverage is blocked', () => {
    const report = buildGitHubCostWatchReport({
      mode: 'monitor',
      generatedAt: '2026-10-01T00:15:00.000Z',
      enterprise: 'capital-ai-online',
      username: 'SvenKulessa',
      enterpriseUsage: { usageItems: [{ product: 'GHEC', sku: 'ghec_licenses', netAmount: 7 }] },
      personalUsage: null,
      personalCoverage: { status: 'BLOCKED', reason: 'missing user credential' },
    });

    expect(report.status).toBe('PARTIAL_COVERAGE');
    expect(report.alertRows).toHaveLength(0);
    expect(report.emailRequired).toBe(true);
  });

  it('uses a dynamic catch-all for a previously unknown positive SKU', () => {
    const report = buildGitHubCostWatchReport({
      mode: 'monitor',
      generatedAt: '2026-10-01T00:15:00.000Z',
      enterprise: 'capital-ai-online',
      username: 'SvenKulessa',
      enterpriseUsage: { usageItems: [{ product: 'FutureProduct', sku: 'future_metered_sku', unitType: 'widgets', netAmount: 0.25 }] },
      personalUsage: { usageItems: [] },
      personalCoverage: { status: 'PASS', reason: null },
    });

    expect(report.alertRows).toHaveLength(1);
    expect(report.alertRows[0].sku).toBe('future_metered_sku');
  });
});
