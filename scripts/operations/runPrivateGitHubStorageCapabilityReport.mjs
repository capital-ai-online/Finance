import fs from 'node:fs';
import {
  EVIDENCE_STORAGE_CLASSES,
  GITHUB_ZERO_COST_STORAGE_LIMITS,
  evaluateRepositoryCacheCapacity,
  evaluateRetentionPolicy,
  evaluateSharedArtifactPoolCapacity,
} from './githubEvidenceStoragePolicy.mjs';

function requiredPath(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error('[PRIVATE-GITHUB-STORAGE-CAPABILITY] missing evidence path: ' + name);
  return value;
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function lower(value) {
  return String(value || '').toLowerCase();
}

function storageRows(actuals, matcher) {
  const rows = Array.isArray(actuals?.rows) ? actuals.rows : [];
  return rows.filter((row) => matcher(lower(row?.product) + ' ' + lower(row?.sku) + ' ' + lower(row?.unitType)));
}

function netAmount(rows) {
  return Number(rows.reduce(
    (sum, row) => sum + (
      typeof row?.netAmount === 'number' && Number.isFinite(row.netAmount) ? row.netAmount : 0
    ),
    0,
  ).toFixed(6));
}

function entry(inventory, capability) {
  return inventory?.entries?.[capability] || { status: 'NOT_OBSERVABLE' };
}

function passData(inventory, capability) {
  const value = entry(inventory, capability);
  return value.status === 'PASS' ? value.data : null;
}

function optionalObservedSharedPoolGiB() {
  const raw = String(process.env.CAPITAL_AI_GITHUB_SHARED_STORAGE_USED_GIB || '').trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('[PRIVATE-GITHUB-STORAGE-CAPABILITY] shared storage observation must be non-negative');
  }
  return value;
}

const billing = readJson(requiredPath('CAPITAL_AI_GITHUB_BILLING_EVIDENCE_PATH'));
const settings = readJson(requiredPath('CAPITAL_AI_GITHUB_SETTINGS_EVIDENCE_PATH'));

const actuals = billing?.monthlyActuals;
const actionsArtifactRows = storageRows(
  actuals,
  (text) => text.includes('actions') && !text.includes('cache')
    && (text.includes('storage') || text.includes('artifact') || text.includes('gigabyte')),
);
const actionsCacheRows = storageRows(
  actuals,
  (text) => text.includes('actions') && text.includes('cache'),
);
const packagesStorageRows = storageRows(
  actuals,
  (text) => text.includes('package')
    && (text.includes('storage') || text.includes('gigabyte')),
);

const repositoryCacheUsage = passData(settings, 'repository.actions.cache_usage.get');
const repositoryCacheLimit = passData(settings, 'repository.actions.cache_storage_limit.get');
const repositoryCacheRetention = passData(settings, 'repository.actions.cache_retention_limit.get');
const repositoryArtifacts = passData(settings, 'repository.actions.artifacts.list');
const repositoryRetention = passData(settings, 'repository.actions.retention.get');
const organizationRetention = passData(settings, 'organization.actions.retention.get');

const cacheSettingsStatus = (
  entry(settings, 'repository.actions.cache_usage.get').status === 'PASS'
  && entry(settings, 'repository.actions.cache_storage_limit.get').status === 'PASS'
) ? 'PASS' : 'NOT_OBSERVABLE';

const artifactSettingsStatus = (
  entry(settings, 'repository.actions.artifacts.list').status === 'PASS'
  && entry(settings, 'repository.actions.retention.get').status === 'PASS'
) ? 'PASS' : 'NOT_OBSERVABLE';

const repositoryCache = evaluateRepositoryCacheCapacity({
  activeCacheBytes: repositoryCacheUsage?.activeCachesSizeInBytes ?? null,
  configuredCacheLimitGiB: repositoryCacheLimit?.maxCacheSizeGiB ?? null,
  billedNetAmount: netAmount(actionsCacheRows),
  entitlement: 'INCLUDED_VERIFIED',
  settingsStatus: cacheSettingsStatus,
});

const artifactPool = evaluateSharedArtifactPoolCapacity({
  sharedPoolUsedGiB: optionalObservedSharedPoolGiB(),
  actionsStorageNetAmount: netAmount(actionsArtifactRows),
  packagesStorageNetAmount: netAmount(packagesStorageRows),
  entitlement: 'INCLUDED_VERIFIED',
  settingsStatus: artifactSettingsStatus,
});

const retentionPolicy = Object.freeze({
  transient1Day: evaluateRetentionPolicy({
    storageClass: 'TRANSIENT_ARTIFACT',
    retentionDays: 1,
  }),
  shortReview7Days: evaluateRetentionPolicy({
    storageClass: 'TRANSIENT_ARTIFACT',
    retentionDays: 7,
  }),
  evidence90Days: evaluateRetentionPolicy({
    storageClass: 'EVIDENCE_ARTIFACT',
    retentionDays: 90,
  }),
});

const output = Object.freeze({
  status: 'PASS',
  mode: 'PRIVATE_GITHUB_ZERO_COST_STORAGE_CAPABILITY_READ_ONLY',
  limits: GITHUB_ZERO_COST_STORAGE_LIMITS,
  storageClasses: EVIDENCE_STORAGE_CLASSES,
  repository: Object.freeze({
    artifacts: repositoryArtifacts,
    artifactAndLogRetentionDays: repositoryRetention?.days ?? null,
    cache: repositoryCacheUsage,
    cacheLimitGiB: repositoryCacheLimit?.maxCacheSizeGiB ?? null,
    cacheRetentionDays: repositoryCacheRetention?.days ?? null,
  }),
  organization: Object.freeze({
    artifactAndLogRetentionDays: organizationRetention?.days ?? null,
  }),
  billing: Object.freeze({
    actionsArtifactStorageNetAmount: netAmount(actionsArtifactRows),
    actionsCacheStorageNetAmount: netAmount(actionsCacheRows),
    packagesStorageNetAmount: netAmount(packagesStorageRows),
  }),
  decisions: Object.freeze({
    repositoryCache,
    sharedActionsPackagesArtifactPool: artifactPool,
  }),
  retentionPolicy,
  sharedPoolObservationSource: process.env.CAPITAL_AI_GITHUB_SHARED_STORAGE_USED_GIB
    ? 'EXPLICIT_PROVIDER_READBACK_INPUT'
    : 'NOT_OBSERVABLE',
  automaticEnablementAllowed: false,
  providerMutationPerformed: false,
  paidUsageMutationPerformed: false,
});

process.stdout.write(JSON.stringify(output, null, 2) + '\n');
