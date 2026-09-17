import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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
const provider = readProviderSnapshot(providerSnapshotPath);
let correlation = null;

if (provider) {
  const providerVersions = new Map(provider.migrations.map(item => [String(item.version), String(item.name || '')]));
  const repositoryVersions = new Map(entries.map(item => [item.version, item.name]));
  const missingInProvider = entries.filter(item => !providerVersions.has(item.version)).map(item => item.version);
  const providerOnly = [...providerVersions.keys()].filter(version => !repositoryVersions.has(version));
  const nameMismatches = entries
    .filter(item => providerVersions.has(item.version) && providerVersions.get(item.version) !== item.name)
    .map(item => ({ version: item.version, repository: item.name, provider: providerVersions.get(item.version) }));

  correlation = {
    status: missingInProvider.length === 0 && providerOnly.length === 0 && nameMismatches.length === 0 ? 'PASS' : 'DRIFT',
    providerProjectRef: provider.projectRef ?? null,
    productionSchemaSha256: provider.productionSchemaSha256,
    providerMigrationCount: provider.migrations.length,
    repositoryMigrationCount: entries.length,
    missingInProvider,
    providerOnly,
    nameMismatches,
  };

  if (process.env.REQUIRE_SUPABASE_MIGRATION_CORRELATION === 'true' && correlation.status !== 'PASS') {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'migration-integrity-evidence.json'), JSON.stringify({
      schemaVersion: '1.0.0',
      migrationManifestSha256,
      migrations: entries,
      correlation,
    }, null, 2) + '\n');
    throw new Error(`Supabase migration correlation drift: ${JSON.stringify({ missingInProvider, providerOnly, nameMismatches })}`);
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
