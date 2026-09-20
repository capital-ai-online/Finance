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
      potentialCostSurfaces: [{
        label: 'GitHub Enterprise Cloud (GHEC)',
        units: ['user-months'],
        policy: 'EXPECTED_ENTERPRISE_BASELINE',
      }],
    });

    expect(message.subject).toContain('vollständige Kostenübersicht');
    expect(message.html).toContain('GitHub Enterprise Cloud (GHEC)');
    expect(message.html).toContain('&lt;script&gt;bad&lt;/script&gt;');
    expect(message.html).not.toContain('<script>bad</script>');
  });
});
