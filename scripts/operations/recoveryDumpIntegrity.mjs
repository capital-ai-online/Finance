#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_RELATIONS = Object.freeze([
  'auth.users',
  'auth.identities',
  'storage.buckets',
  'storage.objects',
]);
const REQUIRED_RELATION_SET = new Set(REQUIRED_RELATIONS);

function normalizeIdentifierPart(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('""', '"');
  }
  return trimmed;
}

function normalizeRelation(raw) {
  return raw.split('.').map(normalizeIdentifierPart).join('.');
}

function relationSchema(relation) {
  const index = relation.indexOf('.');
  return index > 0 ? relation.slice(0, index) : '';
}

export function parseCopyDump(text) {
  const relations = new Map();
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine;
    if (current === null) {
      const match = /^COPY\s+(.+?)\s+\((?:.*)\)\s+FROM stdin;$/.exec(line);
      if (!match) continue;
      const relation = normalizeRelation(match[1]);
      if (relations.has(relation)) {
        throw new Error(`Duplicate COPY block for ${relation}.`);
      }
      current = { relation, rowDigests: [] };
      continue;
    }

    if (line === String.raw`\.`) {
      current.rowDigests.sort();
      const digest = crypto.createHash('sha256');
      for (const rowDigest of current.rowDigests) {
        digest.update(rowDigest, 'hex');
      }
      relations.set(current.relation, {
        rows: current.rowDigests.length,
        sha256: digest.digest('hex'),
      });
      current = null;
      continue;
    }

    current.rowDigests.push(crypto.createHash('sha256').update(line, 'utf8').digest('hex'));
  }

  if (current !== null) {
    throw new Error(`Unterminated COPY block for ${current.relation}.`);
  }

  return relations;
}

function assertRequiredRelations(relations, label) {
  const missing = REQUIRED_RELATIONS.filter((relation) => !relations.has(relation));
  if (missing.length > 0) {
    throw new Error(`${label} is missing required recovery relations: ${missing.join(', ')}.`);
  }
}

function recoveryRelations(relations) {
  return [...relations.keys()]
    .filter(
      (relation) => relationSchema(relation) === 'public' || REQUIRED_RELATION_SET.has(relation),
    )
    .sort();
}

function countRelations(relations, schema) {
  return recoveryRelations(relations).filter((relation) => relationSchema(relation) === schema).length;
}

function criticalRows(relations) {
  return {
    authUsersRows: relations.get('auth.users')?.rows ?? null,
    authIdentitiesRows: relations.get('auth.identities')?.rows ?? null,
    storageBucketsRows: relations.get('storage.buckets')?.rows ?? null,
    storageObjectsRows: relations.get('storage.objects')?.rows ?? null,
  };
}

function assertStorageBinaryBoundary(relations) {
  const storageObjectsRows = relations.get('storage.objects')?.rows ?? 0;
  if (storageObjectsRows > 0) {
    throw new Error(
      `Supabase Storage contains ${storageObjectsRows} object metadata row(s), but this harness does not back up binary objects.`,
    );
  }
}

export function inspectRecoveryDump(text) {
  const relations = parseCopyDump(text);
  assertRequiredRelations(relations, 'Source dump');
  assertStorageBinaryBoundary(relations);

  const publicRelations = countRelations(relations, 'public');
  if (publicRelations === 0) {
    throw new Error('Source dump contains no public-schema relations.');
  }

  return {
    schemaVersion: '1.0.0',
    publicRelations,
    authRelations: countRelations(relations, 'auth'),
    storageRelations: countRelations(relations, 'storage'),
    ...criticalRows(relations),
    storageBinaryCoverage: 'REQUIRES_ZERO_OBJECTS',
  };
}

export function compareRecoveryDumps(sourceText, restoredText) {
  const source = parseCopyDump(sourceText);
  const restored = parseCopyDump(restoredText);
  assertRequiredRelations(source, 'Source dump');
  assertRequiredRelations(restored, 'Restored dump');
  assertStorageBinaryBoundary(source);

  const scopedRelations = new Set([...recoveryRelations(source), ...recoveryRelations(restored)]);
  const mismatches = [...scopedRelations]
    .filter((relation) => {
      const sourceValue = source.get(relation);
      const restoredValue = restored.get(relation);
      return (
        !sourceValue ||
        !restoredValue ||
        sourceValue.rows !== restoredValue.rows ||
        sourceValue.sha256 !== restoredValue.sha256
      );
    })
    .sort();

  const publicRelationsCompared = [...scopedRelations].filter(
    (relation) => relationSchema(relation) === 'public',
  ).length;
  const authRelationsCompared = [...scopedRelations].filter(
    (relation) => relationSchema(relation) === 'auth',
  ).length;
  const storageRelationsCompared = [...scopedRelations].filter(
    (relation) => relationSchema(relation) === 'storage',
  ).length;

  const summary = {
    schemaVersion: '1.0.0',
    publicRelationsCompared,
    authRelationsCompared,
    storageRelationsCompared,
    mismatchCount: mismatches.length,
    mismatches,
    dataIntegrityMatch:
      publicRelationsCompared > 0 &&
      authRelationsCompared === 2 &&
      storageRelationsCompared === 2 &&
      mismatches.length === 0,
    ...criticalRows(source),
  };

  if (!summary.dataIntegrityMatch) {
    throw new Error(
      `Recovery data fingerprint mismatch: ${mismatches.join(', ') || 'coverage incomplete'}.`,
    );
  }

  return summary;
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
}

function runCli(argv) {
  const [mode, sourcePath, targetOrOutput, maybeOutput] = argv;

  if (mode === 'inspect' && sourcePath && targetOrOutput && !maybeOutput) {
    writeJson(targetOrOutput, inspectRecoveryDump(fs.readFileSync(sourcePath, 'utf8')));
    return;
  }

  if (mode === 'compare' && sourcePath && targetOrOutput && maybeOutput) {
    writeJson(
      maybeOutput,
      compareRecoveryDumps(
        fs.readFileSync(sourcePath, 'utf8'),
        fs.readFileSync(targetOrOutput, 'utf8'),
      ),
    );
    return;
  }

  throw new Error(
    'Usage: recoveryDumpIntegrity.mjs inspect <source.sql> <summary.json> | compare <source.sql> <restored.sql> <summary.json>',
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
