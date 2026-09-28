import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const root = process.cwd();
const workflow = fs.readFileSync(path.join(root, '.github/workflows/ops-recovery-evidence.yml'), 'utf8');

describe('OPS-08 Supabase recovery contract', () => {
  it('runs the daily backup at 04:00 Europe/Berlin across CET/CEST without trusting delayed runner time', () => {
    assert.match(workflow, /cron: '0 2 \* \* \*'/);
    assert.match(workflow, /cron: '0 3 \* \* \*'/);
    assert.match(workflow, /github\.event\.schedule/);
    assert.match(workflow, /UTC_OFFSET=.*Europe\/Berlin date \+%z/);
    assert.match(workflow, /UTC_OFFSET.*\+0200[\s\S]*SCHEDULE.*0 2 \* \* \*/);
    assert.match(workflow, /UTC_OFFSET.*\+0100[\s\S]*SCHEDULE.*0 3 \* \* \*/);
    assert.doesNotMatch(workflow, /LOCAL_HOUR/);
    assert.match(workflow, /EXECUTE.*true[\s\S]*LOCAL_WEEKDAY.*1/);
  });

  it('keeps weekly cron history archival encrypted and immutable before retention', () => {
    assert.match(workflow, /backup-and-cron-archive/);
    assert.match(workflow, /cron-job-run-details_\$\{WEEK_START\}_to_\$\{WEEK_END\}\.csv/);
    assert.match(workflow, /gzip -9/);
    assert.match(workflow, /age -r "\$AGE_RECIPIENT"/);
    const upload = workflow.indexOf('id: offsite_artifact');
    const retention = workflow.indexOf('id: cron_retention');
    assert.ok(upload >= 0 && retention > upload, 'retention must run only after archive upload');
    assert.match(workflow, /steps\.offsite_artifact\.outcome == 'success'/);
    assert.match(workflow, /steps\.drive_mirror\.outcome == 'success'/);
    assert.match(workflow, /command_sha256/);
  });

  it('mirrors only encrypted backup material to Google Drive on weekly cadence', () => {
    assert.match(workflow, /googleDriveBackupUpload\.mjs/);
    assert.match(workflow, /OPS_RECOVERY_GDRIVE_REFRESH_TOKEN/);
    assert.match(workflow, /OPS_RECOVERY_GDRIVE_FOLDER_ID: '13HiWDBT2WAID_7l0TL2SjS2DiI5HlP_e'/);
    assert.match(workflow, /ENCRYPTED_PATH/);
    assert.doesNotMatch(workflow, /googleDriveBackupUpload\.mjs[^\n]*(roles\.sql|schema\.sql|data\.sql)/);
  });

  it('runs a read-only Supabase security posture without GitHub Advanced Security', () => {
    assert.match(workflow, /Supabase Security-Posture read-only/);
    assert.match(workflow, /publicExecutableSecurityDefinerFunctions/);
    assert.match(workflow, /appTablesWithoutRls/);
    assert.doesNotMatch(workflow, /github\/codeql-action|CodeQL/);
  });
});
