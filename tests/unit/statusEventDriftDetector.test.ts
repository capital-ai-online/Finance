import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  detectStatusEventDrift,
  detectStatusEventDriftAfterMerge,
} from '../../src/platform/Documentary/Discovery/StatusEventDriftDetector';

function writeFixture(root: string, relative: string, content: string): void {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
}

describe('Documentary Phase B StatusEventDriftDetector', () => {
  it('detects drift for SEO_WP_S1-style PRE-MUTATION header with applied claim and Apply-Evidenz', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-status-drift-'));

    writeFixture(
      root,
      'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md',
      [
        '# SEO WP-S1 Migration-Ledger-Abgleich',
        '',
        'Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH',
        'Date: 2026-08-15',
        'Work claim: `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`',
        '',
        '## Apply-Evidenz',
        '',
        'Ausgefuehrt 2026-08-15, Owner-Freigabe SvenKulessa.',
        '',
        '| Schritt | Ergebnis |',
        '| --- | --- |',
        '| FK-Apply | `success: true`. Verifikation Ledger bestaetigt. |',
        '| Mutation Ledger | Vier UPDATEs, commit. |',
        '| Verifikation Ledger | schema_migrations zeigt Repo-Versionen. |',
      ].join('\n')
    );

    writeFixture(
      root,
      '.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json',
      JSON.stringify({
        claimId: 'SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15',
        status: 'applied',
        externalMutations: [
          'Supabase AIFINANCIAL: ALTER TABLE seo_rank_snapshots FK',
          'Supabase AIFINANCIAL: UPDATE schema_migrations',
        ],
      })
    );

    const report = detectStatusEventDrift({
      repoRoot: root,
      documentPaths: ['docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'],
      scannedAt: '2026-08-16T00:00:00.000Z',
      sourceCommit: '355c94b910336454d6de4494f9c2660b721925fc',
    });

    expect(report.summary.scanned).toBe(1);
    expect(report.summary.drift).toBe(1);
    expect(report.findings).toHaveLength(1);

    const finding = report.findings[0];
    expect(finding.documentPath).toBe('docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md');
    expect(finding.headerClass).toBe('PRE_MUTATION');
    expect(finding.headerStatus).toMatch(/PRE-MUTATION/);
    expect(finding.claimId).toBe('SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15');
    expect(finding.claimStatus).toBe('applied');
    expect(finding.evidenceStatus).toBe('APPLIED_WITH_VERIFICATION');
    expect(finding.drift).toBe(true);
    expect(finding.conflict).toBe(false);
    expect(finding.recommendedHeaderStatus).toBe('VERIFIED PASS');
    expect(finding.evidenceTimestamps).toContain('2026-08-15');
    expect(finding.provenance.detectorVersion).toBe('0.1.0-phase-b');
    expect(finding.provenance.evidenceSection).toMatch(/Apply-Evidenz/i);
  });

  it('does not flag PRE_MUTATION without applied claim or Apply-Evidenz', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-status-clean-'));

    writeFixture(
      root,
      'docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md',
      [
        '# GitGuardian-/Snyk-App-Integration',
        '',
        'Status: PRE-MUTATION / OWNER ACTION REQUIRED',
        'Datum: 2026-08-14',
        '',
        '## Zielzustand',
        '',
        'Noch keine Mutation ausgefuehrt.',
      ].join('\n')
    );

    const report = detectStatusEventDrift({
      repoRoot: root,
      documentPaths: ['docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md'],
    });

    expect(report.summary.drift).toBe(0);
    expect(report.findings[0].headerClass).toBe('PRE_MUTATION');
    expect(report.findings[0].drift).toBe(false);
    expect(report.findings[0].recommendedHeaderStatus).toBeNull();
  });

  it('annotates successful merge as trigger without writing status', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-status-merge-'));

    writeFixture(
      root,
      'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md',
      [
        '# SEO WP-S1',
        'Status: PRE-MUTATION / OWNER-FREIGABE ERFORDERLICH',
        'Work claim: `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`',
        '## Apply-Evidenz',
        'Ausgefuehrt 2026-08-15 success: true Verifikation schema_migrations.',
      ].join('\n')
    );

    writeFixture(
      root,
      '.ai/work-claims/SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15.json',
      JSON.stringify({
        claimId: 'SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15',
        status: 'applied',
        externalMutations: ['mutation-a'],
      })
    );

    const report = detectStatusEventDriftAfterMerge({
      repoRoot: root,
      documentPaths: ['docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'],
      pullRequestNumber: 346,
      mergeCommitSha: '440901c0a024283edae87e3eb0a13e5010676afb',
      mergedAt: '2026-08-15T22:16:12Z',
    });

    expect(report.mergeTrigger?.mergeSucceeded).toBe(true);
    expect(report.mergeTrigger?.pullRequestNumber).toBe(346);
    expect(report.findings[0].drift).toBe(true);
    expect(report.findings[0].mergeTrigger?.mergeSucceeded).toBe(true);
    // Detector remains read-only: no mutation of fixture files
    const headerStill = fs.readFileSync(
      path.join(root, 'docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md'),
      'utf8'
    );
    expect(headerStill).toMatch(/PRE-MUTATION/);
  });
});
