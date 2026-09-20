import { describe, expect, it } from 'vitest';
import { buildGitHubBillingCostWatchEmail } from '../../server/billing/githubBillingAlertMailer';

describe('GitHub billing alert mail projection', () => {
  it('renders a complete test overview and escapes provider-controlled strings', () => {
    const message = buildGitHubBillingCostWatchEmail({
      mode: 'test',
      status: 'PASS',
      generatedAt: '2026-10-01T00:15:00.000Z',
      totals: {
        enterpriseNet: 7,
        personalNet: 0,
        globalNet: 7,
        expectedEnterpriseLicenseNet: 7,
        additionalNet: 0,
      },
      coverage: {
        enterprise: { status: 'PASS' },
        personal: { status: 'PASS' },
      },
      rows: [{
        source: 'enterprise',
        product: '<script>bad</script>',
        sku: 'ghec_licenses',
        unitType: 'user-months',
        grossAmount: 7,
        discountAmount: 0,
        netAmount: 7,
      }],
      alertRows: [],
      detailRows: [{
        source: 'organization',
        date: '2026-10-01',
        organizationName: 'capital-ai-online',
        repositoryName: 'capital-ai-online/Finance',
        product: 'Actions',
        sku: 'Actions Linux',
        unitType: 'minutes',
        netAmount: 0,
      }],
      alertDetailRows: [],
      potentialCostSurfaces: [{
        label: 'GitHub Enterprise Cloud (GHEC)',
        units: ['user-months'],
        policy: 'EXPECTED_ENTERPRISE_BASELINE',
      }],
    });

    expect(message.subject).toContain('vollständige Kostenübersicht');
    expect(message.html).toContain('GitHub Enterprise Cloud (GHEC)');
    expect(message.html).toContain('capital-ai-online/Finance');
    expect(message.html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(message.html).not.toContain('<script>bad</script>');
  });

  it('renders a dedicated Actions warning subject at 5,000 minutes', () => {
    const message = buildGitHubBillingCostWatchEmail({
      mode: 'monitor',
      status: 'PASS',
      generatedAt: '2026-10-01T00:15:00.000Z',
      actionsMinutes: {
        consumedGrossMinutes: 5_000,
        warningThresholdMinutes: 5_000,
        blockerThresholdMinutes: 45_000,
        remainingToBlockerMinutes: 40_000,
        state: 'WARNING',
      },
      totals: {},
      coverage: { enterprise: { status: 'PASS' }, organizationAttribution: { status: 'PASS' }, personal: { status: 'PASS' } },
      rows: [],
      alertRows: [],
      detailRows: [],
      alertDetailRows: [],
      potentialCostSurfaces: [],
    });

    expect(message.subject).toContain('ACTIONS-WARNUNG');
    expect(message.html).toContain('5.000');
    expect(message.html).toContain('40.000');
  });

  it('renders a dedicated Actions blocker subject at 45,000 minutes', () => {
    const message = buildGitHubBillingCostWatchEmail({
      mode: 'monitor',
      status: 'PASS',
      generatedAt: '2026-10-01T00:15:00.000Z',
      actionsMinutes: {
        consumedGrossMinutes: 45_000,
        warningThresholdMinutes: 5_000,
        blockerThresholdMinutes: 45_000,
        remainingToBlockerMinutes: 0,
        state: 'BLOCKED',
      },
      totals: {},
      coverage: { enterprise: { status: 'PASS' }, organizationAttribution: { status: 'PASS' }, personal: { status: 'PASS' } },
      rows: [],
      alertRows: [],
      detailRows: [],
      alertDetailRows: [],
      potentialCostSurfaces: [],
    });

    expect(message.subject).toContain('ACTIONS-BLOCKER');
    expect(message.html).toContain('BLOCKED');
  });
});
