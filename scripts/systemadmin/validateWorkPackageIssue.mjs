import fs from 'node:fs';
import path from 'node:path';
import { lookupWorkPackage } from './workPackages/registry.mjs';

const ALLOWED_KEYS = new Set([
  'version',
  'mode',
  'workPackageId',
  'mandateId',
  'roadmapItem',
  'baseSha',
  'branchName',
]);

const SHA = /^[a-f0-9]{40}$/;

function fail(message) {
  throw new Error(`[WORKPACKAGE-REQUEST][SECURITY] ${message}`);
}

function branchPattern(prefix) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}[a-z0-9][a-z0-9-]{0,31}$`);
}

export function validateWorkPackageIssueBody(raw) {
  if (typeof raw !== 'string' || !raw.trim()) fail('Issue-Body fehlt.');
  if (Buffer.byteLength(raw, 'utf8') > 8_192) fail('Issue-Body überschreitet 8 KiB.');

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('Issue-Body muss ausschließlich gültiges JSON enthalten.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('Execution Request muss ein Objekt sein.');
  }

  for (const key of Object.keys(value)) {
    if (!ALLOWED_KEYS.has(key)) fail(`Unbekanntes Request-Feld: ${key}.`);
  }

  if (value.version !== '1.0') fail('version muss 1.0 sein.');
  if (value.mode !== 'BOUNDED_WORK_PACKAGE') fail('Der Work-Package-Host erlaubt nur BOUNDED_WORK_PACKAGE.');

  if (typeof value.workPackageId !== 'string') fail('workPackageId fehlt.');
  const workPackage = lookupWorkPackage(value.workPackageId);
  if (!workPackage) fail(`workPackageId ist nicht im Katalog registriert: ${value.workPackageId}.`);

  if (value.mandateId !== workPackage.mandateId) {
    fail('mandateId stimmt nicht mit dem für dieses Arbeitspaket registrierten Mandat überein.');
  }
  if (value.roadmapItem !== workPackage.roadmapItem) {
    fail('roadmapItem stimmt nicht mit dem für dieses Arbeitspaket registrierten Roadmap-Item überein.');
  }
  if (typeof value.baseSha !== 'string' || !SHA.test(value.baseSha)) {
    fail('baseSha muss ein vollständiger lowercase SHA-1 sein.');
  }
  if (typeof value.branchName !== 'string' || !branchPattern(workPackage.branchPrefix).test(value.branchName)) {
    fail('branchName liegt außerhalb des für dieses Arbeitspaket reservierten Namespaces.');
  }

  return Object.freeze({
    version: value.version,
    mode: value.mode,
    workPackageId: value.workPackageId,
    mandateId: value.mandateId,
    roadmapItem: value.roadmapItem,
    baseSha: value.baseSha,
    branchName: value.branchName,
  });
}

function main() {
  const output = process.env.SYSTEMADMIN_REQUEST_OUTPUT;
  if (!output) fail('SYSTEMADMIN_REQUEST_OUTPUT fehlt.');
  const request = validateWorkPackageIssueBody(process.env.SYSTEMADMIN_ISSUE_BODY ?? '');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(request)}\n`, { encoding: 'utf8', mode: 0o600 });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
