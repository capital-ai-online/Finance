import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEDGER_RELATIVE_PATH = 'docs/projects/operations/controlled-implementation/OPS_02_SUPABASE_MIGRATION_LEDGER_RECONCILIATION.json';
export const EXPECTED_REMOTE_TOTAL = 71;
export const ALLOWED_CLASSIFICATIONS = new Set([
  'EXACT_MATCH',
  'TIMESTAMP_ALIAS',
  'REMOTE_ONLY_HISTORY',
]);

export function parseMigrationFilename(filename) {
  const match = /^(\d{14})_(.+)\.sql$/.exec(filename);
  if (!match) return null;
  return { version: match[1], name: match[2] };
}

function currentLocalMigrations(root) {
  const migrationDir = path.join(root, 'supabase', 'migrations');
  if (!fs.existsSync(migrationDir)) return [];
  return fs.readdirSync(migrationDir)
    .map((filename) => ({ filename, parsed: parseMigrationFilename(filename) }))
    .filter(({ parsed }) => parsed !== null)
    .map(({ filename, parsed }) => ({
      filename,
      version: parsed.version,
      name: parsed.name,
      local_path: `supabase/migrations/${filename}`,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

export function loadSupabaseMigrationLedger(root = process.cwd()) {
  const ledgerPath = path.join(root, LEDGER_RELATIVE_PATH);
  return JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
}

export function validateSupabaseMigrationLedgerObject(root, ledger) {
  const errors = [];
  const local = currentLocalMigrations(root);
  const byVersion = new Map(local.map((entry) => [entry.version, entry]));
  const byName = new Map(local.map((entry) => [entry.name, entry]));
  const byPath = new Map(local.map((entry) => [entry.local_path, entry]));
  const remote = Array.isArray(ledger?.remote_migrations) ? ledger.remote_migrations : [];

  if (ledger?.project !== 'CAPITAL-AI-OPS') errors.push('ledger project must be CAPITAL-AI-OPS');
  if (ledger?.primary_pvc !== 'PVC-02') errors.push('ledger primary_pvc must be PVC-02');
  if (ledger?.primary_owner !== 'CAPITAL-AI-OPS') errors.push('ledger primary_owner must be CAPITAL-AI-OPS');
  if (remote.length !== EXPECTED_REMOTE_TOTAL) {
    errors.push(`remote migration snapshot must contain ${EXPECTED_REMOTE_TOTAL} rows, got ${remote.length}`);
  }

  const remoteVersions = new Set();
  const mappedLocalPaths = new Set();
  const counts = { EXACT_MATCH: 0, TIMESTAMP_ALIAS: 0, REMOTE_ONLY_HISTORY: 0 };

  for (const entry of remote) {
    const label = `${entry?.remote_version ?? '<missing>'}/${entry?.remote_name ?? '<missing>'}`;
    if (!/^\d{14}$/.test(entry?.remote_version ?? '')) {
      errors.push(`${label}: invalid remote_version`);
      continue;
    }
    if (remoteVersions.has(entry.remote_version)) errors.push(`${label}: duplicate remote_version`);
    remoteVersions.add(entry.remote_version);

    if (!ALLOWED_CLASSIFICATIONS.has(entry?.classification)) {
      errors.push(`${label}: unknown classification ${entry?.classification ?? '<missing>'}`);
      continue;
    }
    counts[entry.classification] += 1;

    const sameVersion = byVersion.get(entry.remote_version);
    const sameName = byName.get(entry.remote_name);

    if (entry.classification === 'EXACT_MATCH') {
      if (!sameVersion) errors.push(`${label}: EXACT_MATCH has no local timestamp match`);
      if (!entry.local_path || !byPath.has(entry.local_path)) errors.push(`${label}: EXACT_MATCH local_path missing`);
      if (entry.local_version !== entry.remote_version) errors.push(`${label}: EXACT_MATCH local_version differs`);
      if (sameVersion && sameVersion.name !== entry.remote_name) errors.push(`${label}: EXACT_MATCH normalized name differs`);
    }

    if (entry.classification === 'TIMESTAMP_ALIAS') {
      if (sameVersion) errors.push(`${label}: TIMESTAMP_ALIAS unexpectedly has exact local timestamp`);
      if (!sameName) errors.push(`${label}: TIMESTAMP_ALIAS has no same-name current local migration`);
      if (!entry.local_path || !byPath.has(entry.local_path)) errors.push(`${label}: TIMESTAMP_ALIAS local_path missing`);
      if (entry.local_version === entry.remote_version) errors.push(`${label}: TIMESTAMP_ALIAS timestamps must differ`);
      if (sameName && entry.local_path !== sameName.local_path) errors.push(`${label}: TIMESTAMP_ALIAS points to wrong local path`);
    }

    if (entry.classification === 'REMOTE_ONLY_HISTORY') {
      if (sameVersion) errors.push(`${label}: REMOTE_ONLY_HISTORY has a current local timestamp match`);
      if (sameName) errors.push(`${label}: REMOTE_ONLY_HISTORY has a current local same-name alias`);
      if (entry.local_version !== null || entry.local_path !== null) {
        errors.push(`${label}: REMOTE_ONLY_HISTORY must not claim a current local mapping`);
      }
    }

    if (entry.local_path) mappedLocalPaths.add(entry.local_path);
  }

  const actualLocalOnly = local
    .filter((entry) => !mappedLocalPaths.has(entry.local_path))
    .map((entry) => entry.local_path)
    .sort();
  const declaredLocalOnly = (ledger?.local_only_migrations ?? [])
    .map((entry) => entry.local_path)
    .sort();

  if (JSON.stringify(actualLocalOnly) !== JSON.stringify(declaredLocalOnly)) {
    errors.push('local_only_migrations does not equal the current local set difference');
  }

  const summary = ledger?.summary ?? {};
  const expectedSummary = {
    remote_total: remote.length,
    local_total: local.length,
    exact_match: counts.EXACT_MATCH,
    timestamp_alias: counts.TIMESTAMP_ALIAS,
    remote_only_history: counts.REMOTE_ONLY_HISTORY,
    unknown: 0,
    mapped_current_local: mappedLocalPaths.size,
    local_only: actualLocalOnly.length,
  };

  for (const [key, expected] of Object.entries(expectedSummary)) {
    if (summary[key] !== expected) errors.push(`summary.${key}: expected ${expected}, got ${summary[key]}`);
  }

  if (counts.EXACT_MATCH + counts.TIMESTAMP_ALIAS + counts.REMOTE_ONLY_HISTORY !== remote.length) {
    errors.push('classification totals do not cover every remote migration exactly once');
  }

  return errors;
}

export function validateSupabaseMigrationLedgerReconciliation(root = process.cwd()) {
  try {
    return validateSupabaseMigrationLedgerObject(root, loadSupabaseMigrationLedger(root));
  } catch (error) {
    return [`Supabase migration ledger reconciliation could not be loaded: ${error.message}`];
  }
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const errors = validateSupabaseMigrationLedgerReconciliation();
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
  } else {
    console.log('Supabase migration ledger reconciliation: OK — 71/71 remote versions classified, unknown=0');
  }
}
