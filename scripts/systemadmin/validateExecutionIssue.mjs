import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_KEYS = new Set([
  'version',
  'mode',
  'mandateId',
  'roadmapItem',
  'baseSha',
  'branchName',
]);

const BRANCH = /^agent\/sa3b-host-probe-[a-z0-9][a-z0-9-]{0,31}$/;
const SHA = /^[a-f0-9]{40}$/;

function fail(message) {
  throw new Error(`[SA3B-REQUEST][SECURITY] ${message}`);
}

export function validateExecutionIssueBody(raw) {
  if (typeof raw !== 'string' || !raw.trim()) fail('Issue-Body fehlt.');
  if (Buffer.byteLength(raw, 'utf8') > 8_192) fail('Issue-Body überschreitet 8 KiB.');

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('Issue-Body muss ausschließlich gültiges JSON enthalten.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Execution Request muss ein Objekt sein.');

  for (const key of Object.keys(value)) {
    if (!ALLOWED_KEYS.has(key)) fail(`Unbekanntes Request-Feld: ${key}.`);
  }

  if (value.version !== '1.0') fail('version muss 1.0 sein.');
  if (value.mode !== 'BRANCH_PROBE') fail('SA3B erlaubt vor VERIFIED PASS nur BRANCH_PROBE.');
  if (value.mandateId !== 'REM-SA3B-PROBE-001') fail('Nur der kanonische SA3B-Probe-REM ist zulässig.');
  if (value.roadmapItem !== 'SA3B-HOST-PROBE') fail('roadmapItem ist für den SA3B-Probe ungültig.');
  if (typeof value.baseSha !== 'string' || !SHA.test(value.baseSha)) fail('baseSha muss ein vollständiger lowercase SHA-1 sein.');
  if (typeof value.branchName !== 'string' || !BRANCH.test(value.branchName)) fail('branchName liegt außerhalb des SA3B-Probe-Namespaces.');

  return Object.freeze({
    version: value.version,
    mode: value.mode,
    mandateId: value.mandateId,
    roadmapItem: value.roadmapItem,
    baseSha: value.baseSha,
    branchName: value.branchName,
  });
}

function main() {
  const output = process.env.SYSTEMADMIN_REQUEST_OUTPUT;
  if (!output) fail('SYSTEMADMIN_REQUEST_OUTPUT fehlt.');
  const request = validateExecutionIssueBody(process.env.SYSTEMADMIN_ISSUE_BODY ?? '');
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
