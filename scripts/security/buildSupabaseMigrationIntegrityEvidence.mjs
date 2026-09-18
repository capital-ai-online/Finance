import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  loadSupabaseMigrationLedger,
  validateSupabaseMigrationLedgerObject,
} from '../governance/verifySupabaseMigrationLedgerReconciliation.mjs';

const repoRoot = process.cwd();
const migrationDir = path.join(repoRoot, 'supabase', 'migrations');
const outputDir = path.join(repoRoot, 'artifacts', 'supabase-integrity');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseMigrationFile(fileName) {
  const match = fileName.match(/^(\d{14})_(.+)\.sql$/);
  if (!match) return null;
  return { version: match[1], name: match[2] };
}

function readProviderSnapshot(snapshotPath) {
  if (!snapshotPath) return null;
  const absolute = path.resolve(repoRoot, snapshotPath);
  if (!fs.existsSync(absolute)) throw new Error(`Provider snapshot fehlt: ${snapshotPath}`);
  const parsed = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (!Array.isArray(parsed.migrations)) throw new Error('Provider snapshot muss migrations[] enthalten.');
  if (!/^[0-9a-f]{64}$/.test(String(parsed.productionSchemaSha256 || ''))) {
    throw new Error('Provider snapshot braucht productionSchemaSha256 als SHA-256.');
  }
  return parsed;
}

const entries = fs.readdirSync(migrationDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.sql'))
  .map(entry => {
    const identity = parseMigrationFile(entry.name);
    if (!identity) throw new Error(`Nicht kanonischer Migration-Dateiname: ${entry.name}`);
    const relativePath = path.posix.join('supabase/migrations', entry.name);
    const content = fs.readFileSync(path.join(migrationDir, entry.name));
    return {
      ...identity,
      path: relativePath,
      contentSha256: sha256(content),
      bytes: content.length,
    };
  })
  .sort((a, b) => a.version.localeCompare(b.version) || a.path.localeCompare(b.path));

const duplicateVersions = [...new Set(entries.map(item => item.version).filter((version, index, all) => all.indexOf(version) !== index))];
if (duplicateVersions.length > 0) throw new Error(`Doppelte Migration-Versionen: ${duplicateVersions.join(', ')}`);

const manifestPayload = entries.map(({ version, name, path: filePath, contentSha256 }) =>
  `${version}|${name}|${filePath}|${contentSha256}`,
).join('\n');
const migrationManifestSha256 = sha256(Buffer.from(manifestPayload, 'utf8'));

const providerSnapshotPath = process.env.SUPABASE_PROVIDER_SNAPSHOT || '';
const requireCorrelation = process.env.REQUIRE_SUPABASE_MIGRATION_CORRELATION === 'true';
if (requireCorrelation && !providerSnapshotPath) {
  throw new Error('REQUIRE_SUPABASE_MIGRATION_CORRELATION=true requires SUPABASE_PROVIDER_SNAPSHOT.');
}
const provider = readProviderSnapshot(providerSnapshotPath);
let correlation = null;

if (provider) {
  const ledger = loadSupabaseMigrationLedger(repoRoot);
  const ledgerErrors = validateSupabaseMigrationLedgerObject(repoRoot, ledger);
  if (ledgerErrors.length > 0) {
    throw new Error(`Canonical Supabase migration reconciliation ledger is invalid: ${ledgerErrors.join('; ')}`);
  }

  const providerRows = provider.migrations.map((item, index) => {
    const version = String(item?.version ?? '');
    const name = String(item?.name ?? '');
    if (!/^\d{14}$/.test(version) || !name) {
      throw new Error(`Provider snapshot migrations[${index}] must contain a 14-digit version and non-empty name.`);
    }
    return { version, name };
  });
  const providerVersions = new Set();
  for (const row of providerRows) {
    if (providerVersions.has(row.version)) {
      throw new Error(`Provider snapshot contains duplicate migration version ${row.version}.`);
    }
    providerVersions.add(row.version);
  }

  const ledgerRows = ledger.remote_migrations.map(item => ({
    version: String(item.remote_version),
    name: String(item.remote_name),
    classification: item.classification,
    localVersion: item.local_version,
    localPath: item.local_path,
  }));
  const ledgerByVersion = new Map(ledgerRows.map(item => [item.version, item]));
  const providerByVersion = new Map(providerRows.map(item => [item.version, item]));

  const missingFromProvider = ledgerRows
    .filter(item => !providerByVersion.has(item.version))
    .map(item => ({ version: item.version, expectedName: item.name, classification: item.classification }));
  const unexpectedProvider = providerRows
    .filter(item => !ledgerByVersion.has(item.version))
    .map(item => ({ version: item.version, providerName: item.name }));
  const nameMismatches = providerRows
    .filter(item => ledgerByVersion.has(item.version) && ledgerByVersion.get(item.version).name !== item.name)
    .map(item => ({
      version: item.version,
      expected: ledgerByVersion.get(item.version).name,
      provider: item.name,
      classification: ledgerByVersion.get(item.version).classification,
    }));

  const acceptedTimestampAliases = ledgerRows
    .filter(item => item.classification === 'TIMESTAMP_ALIAS')
    .map(item => ({
      providerVersion: item.version,
      providerName: item.name,
      localVersion: item.localVersion,
      localPath: item.localPath,
    }));
  const acceptedRemoteHistory = ledgerRows
    .filter(item => item.classification === 'REMOTE_ONLY_HISTORY')
    .map(item => ({ providerVersion: item.version, providerName: item.name }));
  const knownLocalOnly = (ledger.local_only_migrations ?? []).map(item => ({
    localVersion: String(item.local_version),
    localName: String(item.local_name),
    localPath: String(item.local_path),
  }));

  correlation = {
    status: missingFromProvider.length === 0 && unexpectedProvider.length === 0 && nameMismatches.length === 0 ? 'PASS' : 'DRIFT',
    basis: 'OPS_02_SUPABASE_MIGRATION_LEDGER_RECONCILIATION',
    providerProjectRef: provider.projectRef ?? null,
    productionSchemaSha256: provider.productionSchemaSha256,
    providerMigrationCount: providerRows.length,
    repositoryMigrationCount: entries.length,
    acceptedTimestampAliases,
    acceptedRemoteHistory,
    knownLocalOnly,
    missingFromProvider,
    unexpectedProvider,
    nameMismatches,
  };

  if (requireCorrelation && correlation.status !== 'PASS') {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'migration-integrity-evidence.json'), JSON.stringify({
      schemaVersion: '1.0.0',
      migrationManifestSha256,
      migrations: entries,
      correlation,
    }, null, 2) + '\n');
    throw new Error(`Supabase migration correlation drift: ${JSON.stringify({
      missingFromProvider,
      unexpectedProvider,
      nameMismatches,
    })}`);
  }
}

const evidence = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  migrationManifestSha256,
  migrationCount: entries.length,
  migrations: entries,
  correlation,
};

fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'migration-integrity-evidence.json');
fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2) + '\n');
console.log(`[supabase-migration-integrity] ${path.relative(repoRoot, outputPath)} :: migrations=${entries.length} :: manifest=${migrationManifestSha256} :: correlation=${correlation?.status ?? 'NOT_BOUND'}`);
