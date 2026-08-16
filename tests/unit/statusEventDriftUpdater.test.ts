import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectStatusEventDrift } from '../../src/platform/Documentary/Discovery/StatusEventDriftDetector';
import {
  applyStatusHeaderUpdates,
  isStatusUpdatePathAllowed,
  proposeStatusHeaderUpdates,
  runControlledStatusHeaderUpdate,
} from '../../src/platform/Documentary/Discovery/StatusEventDriftUpdater';

function writeFixture(root: string, relative: string, content: string): void {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
}

const DRIFT_RUNBOOK = [
  '# SEO WP-S1',
  'Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH',
  'Work claim: `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`',
  '',
  '## Apply-Evidenz',
  '',
  'Ausgefuehrt 2026-08-15 success: true Verifikation schema_migrations.',
  'BODY_MARKER_MUST_REMAIN',
].join('\n');

const DRIFT_CLAIM = JSON.stringify({
  claimId: 'SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15',
  status: 'applied',
  externalMutations: ['mutation-a'],
});

describe('Documentary Phase C StatusEventDriftUpdater', () => {
  it('proposes VERIFIED PASS for SEO_WP_S1-style drift and dry-run does not write', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-updater-dry-'));
    writeFixture(root, 'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md', DRIFT_RUNBOOK);
    writeFixture(
      root,
      '.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json',
      DRIFT_CLAIM
    );

    const report = detectStatusEventDrift({
      repoRoot: root,
      documentPaths: ['docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'],
    });
    const proposals = proposeStatusHeaderUpdates(report);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].proposedHeaderStatus).toBe('VERIFIED PASS');

    const update = applyStatusHeaderUpdates({
      repoRoot: root,
      proposals,
      dryRun: true,
    });

    expect(update.summary.applied).toBe(0);
    expect(update.results[0].dryRun).toBe(true);
    expect(update.results[0].newHeaderStatus).toBe('VERIFIED PASS');

    const still = fs.readFileSync(
      path.join(root, 'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'),
      'utf8'
    );
    expect(still).toMatch(/PRE-MUTATION/);
    expect(still).toContain('BODY_MARKER_MUST_REMAIN');
  });

  it('applies header-only write when dryRun=false and leaves Apply-Evidenz intact', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-updater-write-'));
    writeFixture(root, 'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md', DRIFT_RUNBOOK);
    writeFixture(
      root,
      '.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json',
      DRIFT_CLAIM
    );

    const update = runControlledStatusHeaderUpdate({
      repoRoot: root,
      documentPaths: ['docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'],
      dryRun: false,
    });

    expect(update.summary.applied).toBe(1);
    const next = fs.readFileSync(
      path.join(root, 'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'),
      'utf8'
    );
    expect(next).toMatch(/^Status:\s*VERIFIED PASS$/m);
    expect(next).not.toMatch(/PRE-MUTATION/);
    expect(next).toContain('BODY_MARKER_MUST_REMAIN');
    expect(next).toContain('## Apply-Evidenz');
  });

  it('fail-closed: rejects paths outside allowlist', () => {
    expect(isStatusUpdatePathAllowed('docs/runbooks/x.md')).toBe(true);
    expect(isStatusUpdatePathAllowed('src/platform/Documentary/x.ts')).toBe(false);
    expect(isStatusUpdatePathAllowed('package.json')).toBe(false);
  });

  it('does not propose updates when there is no drift', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-updater-clean-'));
    writeFixture(
      root,
      'docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md',
      ['# GG',
        'Status: PRE-MUTATION / OWNER ACTION REQUIRED',
        '## Zielzustand',
        'Noch offen.',
      ].join('\n')
    );

    const report = detectStatusEventDrift({
      repoRoot: root,
      documentPaths: ['docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md'],
    });
    expect(proposeStatusHeaderUpdates(report)).toHaveLength(0);
  });
});
