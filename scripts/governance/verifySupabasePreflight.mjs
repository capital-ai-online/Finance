import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadSupabaseMigrationLedger,
  validateSupabaseMigrationLedgerReconciliation,
} from './verifySupabaseMigrationLedgerReconciliation.mjs';

export const EXPECTED_PROJECT_REF = 'ryzywoktpmyhwzxmstyu';

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

export function parseRemoteMigrationTsv(text) {
  const rows = [];
  const seen = new Set();
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const separator = rawLine.indexOf('\t');
    if (separator < 0) throw new Error(`Invalid remote migration row: ${rawLine}`);
    const version = rawLine.slice(0, separator).trim();
    const name = rawLine.slice(separator + 1).trim();
    if (!/^\d{14}$/.test(version)) throw new Error(`Invalid remote migration version: ${version}`);
    if (!name) throw new Error(`Remote migration ${version} has an empty name`);
    if (seen.has(version)) throw new Error(`Duplicate remote migration version: ${version}`);
    seen.add(version);
    rows.push({ version, name });
  }
  return rows;
}

export function validateLiveRemoteAgainstLedger(liveRows, ledger) {
  const errors = [];
  const expected = Array.isArray(ledger?.remote_migrations)
    ? ledger.remote_migrations.map((entry) => ({
        version: String(entry.remote_version || ''),
        name: String(entry.remote_name || ''),
      }))
    : [];

  if (liveRows.length !== expected.length) {
    errors.push(`live remote migration count ${liveRows.length} differs from ledger ${expected.length}`);
  }

  const liveByVersion = new Map(liveRows.map((row) => [row.version, row.name]));
  const expectedByVersion = new Map(expected.map((row) => [row.version, row.name]));

  for (const row of expected) {
    const liveName = liveByVersion.get(row.version);
    if (liveName === undefined) {
      errors.push(`ledger migration missing remotely: ${row.version}/${row.name}`);
    } else if (liveName !== row.name) {
      errors.push(`remote name drift for ${row.version}: live=${liveName} ledger=${row.name}`);
    }
  }

  for (const row of liveRows) {
    if (!expectedByVersion.has(row.version)) {
      errors.push(`unclassified remote migration: ${row.version}/${row.name}`);
    }
  }

  return errors;
}

export function runSupabasePreflight({
  candidateRoot,
  remoteTsvPath,
  expectedProjectRef = EXPECTED_PROJECT_REF,
}) {
  const errors = [];
  const resolvedRoot = path.resolve(candidateRoot);
  errors.push(...validateSupabaseMigrationLedgerReconciliation(resolvedRoot));

  const ledger = loadSupabaseMigrationLedger(resolvedRoot);
  const liveRows = parseRemoteMigrationTsv(fs.readFileSync(remoteTsvPath, 'utf8'));
  errors.push(...validateLiveRemoteAgainstLedger(liveRows, ledger));

  if (expectedProjectRef !== EXPECTED_PROJECT_REF) {
    errors.push(`unexpected Supabase project ref: ${expectedProjectRef}`);
  }

  return {
    errors,
    summary: {
      projectRef: expectedProjectRef,
      remoteMigrations: liveRows.length,
      localMigrations: Number(ledger?.summary?.local_total ?? 0),
      localOnlyMigrations: Number(ledger?.summary?.local_only ?? 0),
      exactMatches: Number(ledger?.summary?.exact_match ?? 0),
      timestampAliases: Number(ledger?.summary?.timestamp_alias ?? 0),
      remoteOnlyHistory: Number(ledger?.summary?.remote_only_history ?? 0),
    },
  };
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (!args['candidate-root'] || !args['remote-tsv'] || !args['project-ref']) {
      throw new Error(
        'Usage: verifySupabasePreflight.mjs --candidate-root <dir> --remote-tsv <file> --project-ref <ref> [--summary <file>]',
      );
    }

    const result = runSupabasePreflight({
      candidateRoot: args['candidate-root'],
      remoteTsvPath: args['remote-tsv'],
      expectedProjectRef: args['project-ref'],
    });

    const lines = [
      '## Supabase Free-Tier Preflight',
      `- Project ref: \`${result.summary.projectRef}\``,
      `- Live remote migrations: \`${result.summary.remoteMigrations}\``,
      `- Candidate local migrations: \`${result.summary.localMigrations}\``,
      `- Candidate local-only migrations: \`${result.summary.localOnlyMigrations}\``,
      `- Reconciliation: exact=${result.summary.exactMatches}, timestamp_alias=${result.summary.timestampAliases}, remote_only_history=${result.summary.remoteOnlyHistory}`,
      `- Result: **${result.errors.length === 0 ? 'PASS' : 'FAIL'}**`,
    ];
    if (result.errors.length) lines.push(...result.errors.map((error) => `- ERROR: ${error}`));

    const rendered = `${lines.join('\n')}\n`;
    process.stdout.write(rendered);
    if (args.summary) fs.appendFileSync(args.summary, rendered);

    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(`Supabase preflight failed: ${error.message}`);
    process.exitCode = 1;
  }
}
