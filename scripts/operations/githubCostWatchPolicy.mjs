import { createHash } from 'node:crypto';

export const GITHUB_COST_WATCH_SCHEMA_VERSION = '1.0.0';
export const GITHUB_COST_WATCH_DEFAULT_START = '2026-10-01T00:00:00.000Z';
export const GITHUB_COST_WATCH_RECIPIENT = 'sven.kulessa@capital-ai.online';

export const GITHUB_COST_SURFACE_CATALOG = Object.freeze([
  Object.freeze({ id: 'ghec', label: 'GitHub Enterprise Cloud (GHEC)', units: ['user-months'], policy: 'EXPECTED_ENTERPRISE_BASELINE' }),
  Object.freeze({ id: 'actions_compute', label: 'GitHub Actions hosted runner compute', units: ['minutes'], policy: 'ALERT_ONLY_WHEN_NET_POSITIVE' }),
  Object.freeze({ id: 'actions_storage', label: 'GitHub Actions storage', units: ['gigabyte-hours'], policy: 'ALERT_ONLY_WHEN_NET_POSITIVE' }),
  Object.freeze({ id: 'packages', label: 'GitHub Packages storage/data transfer', units: ['storage', 'data-transfer'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'lfs', label: 'Git Large File Storage (LFS)', units: ['storage', 'bandwidth'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'codespaces', label: 'GitHub Codespaces compute/storage', units: ['compute', 'storage'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'ghas_code_security', label: 'GitHub Code Security', units: ['user-months'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'ghas_secret_protection', label: 'GitHub Secret Protection', units: ['user-months'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'code_quality', label: 'GitHub Code Quality', units: ['committer-licenses', 'ai-credits'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'copilot_ai', label: 'GitHub Copilot licenses / premium requests / AI credits', units: ['seats', 'premium-requests', 'ai-credits'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'copilot_sandboxes', label: 'GitHub Copilot cloud/local sandboxes', units: ['compute', 'storage', 'provider-defined'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'account_plans', label: 'Paid GitHub account plans or fixed subscriptions', units: ['seats', 'months'], policy: 'ALERT_ON_NET_POSITIVE_IF_REPORTED' }),
  Object.freeze({ id: 'models', label: 'GitHub Models or other metered AI usage', units: ['requests', 'tokens', 'provider-defined'], policy: 'ALERT_ON_NET_POSITIVE' }),
  Object.freeze({ id: 'other', label: 'Any new or provider-defined GitHub SKU', units: ['provider-defined'], policy: 'DYNAMIC_CATCH_ALL_ALERT_ON_NET_POSITIVE' }),
]);

function finiteOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeRows(source, usageSummary) {
  const rows = Array.isArray(usageSummary?.usageItems) ? usageSummary.usageItems : [];
  return rows.map((row) => Object.freeze({
    source,
    product: typeof row?.product === 'string' ? row.product : null,
    sku: typeof row?.sku === 'string' ? row.sku : null,
    unitType: typeof row?.unitType === 'string' ? row.unitType : null,
    pricePerUnit: typeof row?.pricePerUnit === 'number' ? row.pricePerUnit : null,
    grossQuantity: typeof row?.grossQuantity === 'number' ? row.grossQuantity : null,
    grossAmount: finiteOrZero(row?.grossAmount),
    discountAmount: finiteOrZero(row?.discountAmount),
    netQuantity: typeof row?.netQuantity === 'number' ? row.netQuantity : null,
    netAmount: finiteOrZero(row?.netAmount),
  }));
}

function normalizeDetailRows(source, usageReport) {
  const rows = Array.isArray(usageReport?.usageItems) ? usageReport.usageItems : [];
  return rows.map((row) => Object.freeze({
    source,
    date: typeof row?.date === 'string' ? row.date : null,
    organizationName: typeof row?.organizationName === 'string' ? row.organizationName : null,
    repositoryName: typeof row?.repositoryName === 'string' ? row.repositoryName : null,
    product: typeof row?.product === 'string' ? row.product : null,
    sku: typeof row?.sku === 'string' ? row.sku : null,
    quantity: typeof row?.quantity === 'number' ? row.quantity : null,
    unitType: typeof row?.unitType === 'string' ? row.unitType : null,
    pricePerUnit: typeof row?.pricePerUnit === 'number' ? row.pricePerUnit : null,
    grossAmount: finiteOrZero(row?.grossAmount),
    discountAmount: finiteOrZero(row?.discountAmount),
    netAmount: finiteOrZero(row?.netAmount),
  }));
}

function isExpectedEnterpriseLicense(row) {
  return row.source === 'enterprise'
    && String(row.sku || '').toLowerCase() === 'ghec_licenses';
}

function sum(rows, key) {
  return Number(rows.reduce((total, row) => total + finiteOrZero(row[key]), 0).toFixed(6));
}

function sortedAlertFingerprintInput(rows, detailRows, cycle) {
  // Deliberately exclude running amounts/quantities. One SKU should alert once when it first
  // becomes billable in a cycle, not every time its accumulated amount changes.
  const normalized = rows.map((row) => ({
    source: row.source,
    product: row.product,
    sku: row.sku,
    unitType: row.unitType,
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const detailed = detailRows.map((row) => ({
    source: row.source,
    organizationName: row.organizationName,
    repositoryName: row.repositoryName,
    product: row.product,
    sku: row.sku,
    unitType: row.unitType,
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify({ cycle, rows: normalized, detailed });
}

export function buildGitHubCostWatchReport({
  mode,
  generatedAt,
  startAt = GITHUB_COST_WATCH_DEFAULT_START,
  enterprise,
  username,
  enterpriseUsage = null,
  organizationUsageDetail = null,
  personalUsage = null,
  personalUsageDetail = null,
  organizationCoverage = { status: 'PASS', reason: null },
  personalCoverage = { status: 'PASS', reason: null },
} = {}) {
  if (!['monitor', 'test'].includes(mode)) throw new Error('[GITHUB-COST-WATCH] mode must be monitor or test');
  const timestamp = new Date(generatedAt || Date.now());
  if (Number.isNaN(timestamp.getTime())) throw new Error('[GITHUB-COST-WATCH] generatedAt is invalid');

  const enterpriseRows = normalizeRows('enterprise', enterpriseUsage);
  const personalRows = normalizeRows('personal', personalUsage);
  const allRows = Object.freeze([...enterpriseRows, ...personalRows]);
  const expectedEnterpriseLicenseRows = Object.freeze(allRows.filter(isExpectedEnterpriseLicense));
  const additionalRows = Object.freeze(allRows.filter((row) => !isExpectedEnterpriseLicense(row)));
  const positiveAdditionalRows = Object.freeze(additionalRows.filter((row) => row.netAmount > 0));
  const detailRows = Object.freeze([
    ...normalizeDetailRows('organization', organizationUsageDetail),
    ...normalizeDetailRows('personal', personalUsageDetail),
  ]);
  const positiveDetailRows = Object.freeze(detailRows.filter((row) => row.netAmount > 0));

  const cycle = Object.freeze({
    year: timestamp.getUTCFullYear(),
    month: timestamp.getUTCMonth() + 1,
  });
  const coverageBlocked = organizationCoverage?.status !== 'PASS' || personalCoverage?.status !== 'PASS';
  const fingerprint = createHash('sha256')
    .update(sortedAlertFingerprintInput(positiveAdditionalRows, positiveDetailRows, cycle))
    .update(coverageBlocked
      ? `|coverage:org=${organizationCoverage?.reason || organizationCoverage?.status || 'blocked'};personal=${personalCoverage?.reason || personalCoverage?.status || 'blocked'}`
      : '|coverage:pass')
    .digest('hex');

  return Object.freeze({
    schemaVersion: GITHUB_COST_WATCH_SCHEMA_VERSION,
    status: coverageBlocked ? 'PARTIAL_COVERAGE' : 'PASS',
    mode,
    generatedAt: timestamp.toISOString(),
    monitoringStartAt: startAt,
    recipient: GITHUB_COST_WATCH_RECIPIENT,
    enterprise,
    username,
    cycle,
    policy: Object.freeze({
      expectedEnterpriseLicenseSku: 'ghec_licenses',
      actionsTreatment: 'Actions is not exempt when netAmount becomes positive; included/discounted Actions with netAmount=0 does not alert.',
      alertCondition: 'Every positive netAmount outside enterprise ghec_licenses, plus any coverage failure.',
      amountSemantics: 'netAmount is the billed cost returned by GitHub billing usage summary; nested organization/repository views are not added again.',
      pollingSemantics: 'Near-real-time only: alert at the first successful poll after GitHub exposes the billed usage.',
    }),
    coverage: Object.freeze({
      enterprise: Object.freeze({ status: 'PASS' }),
      organizationAttribution: Object.freeze({
        status: organizationCoverage?.status || 'BLOCKED',
        reason: organizationCoverage?.reason || null,
      }),
      personal: Object.freeze({
        status: personalCoverage?.status || 'BLOCKED',
        reason: personalCoverage?.reason || null,
      }),
    }),
    totals: Object.freeze({
      enterpriseNet: sum(enterpriseRows, 'netAmount'),
      personalNet: sum(personalRows, 'netAmount'),
      globalNet: Number((sum(enterpriseRows, 'netAmount') + sum(personalRows, 'netAmount')).toFixed(6)),
      expectedEnterpriseLicenseNet: sum(expectedEnterpriseLicenseRows, 'netAmount'),
      additionalNet: sum(positiveAdditionalRows, 'netAmount'),
    }),
    rows: allRows,
    alertRows: positiveAdditionalRows,
    detailRows,
    alertDetailRows: positiveDetailRows,
    potentialCostSurfaces: GITHUB_COST_SURFACE_CATALOG,
    alertFingerprint: fingerprint,
    emailRequired: mode === 'test' || coverageBlocked || positiveAdditionalRows.length > 0,
    secretsOrTokensLogged: false,
  });
}
