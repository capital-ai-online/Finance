import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');
const json = (repoPath: string) => JSON.parse(read(repoPath));

const AUTHORITY_ID = 'AUTH-ADR-LEGACY-COMPLIANCE-VALUE-CHAIN-0007';
const HISTORICAL_PATH = 'docs/adr/historical/ADR-0007-compliance-value-chain.md';
const REDIRECT_PATH = 'docs/adr/ADR-0007-compliance-value-chain.md';

describe('ADR-0007 lifecycle and semantic reconciliation', () => {
  it('registers ADR-0007 as historical under one stable authority identity', () => {
    const adrRegistry = json('docs/adr/registry.json');
    const authorityRegistry = json('docs/governance/authority-registry.json');

    const adr = adrRegistry.migratedRecords.find(
      (item: { displayId?: string }) => item.displayId === 'ADR-0007',
    );
    const authority = authorityRegistry.entries.find(
      (item: { authorityId?: string }) => item.authorityId === AUTHORITY_ID,
    );

    expect(adr).toMatchObject({
      authorityId: AUTHORITY_ID,
      displayId: 'ADR-0007',
      version: '1.0.0',
      lifecycle: 'historical',
      path: HISTORICAL_PATH,
      supersedes: [],
    });
    expect(authority).toMatchObject({
      authorityId: AUTHORITY_ID,
      displayId: 'ADR-0007',
      version: '1.0.0',
      lifecycle: 'historical',
      path: HISTORICAL_PATH,
      precedenceTier: 5,
    });
  });

  it('preserves the historical decision while making the old active path non-authorizing', () => {
    const historical = read(HISTORICAL_PATH);
    const redirect = read(REDIRECT_PATH);

    expect(historical).toContain('HISTORICAL — NON-AUTHORIZING');
    expect(historical).toContain('2026-09-05 lifecycle / semantic reconciliation');
    expect(redirect).toContain('Legacy Compliance Value Chain Redirect — NON-AUTHORIZING');
    expect(redirect).toContain(AUTHORITY_ID);
    expect(redirect).toContain(HISTORICAL_PATH);
    expect(redirect).toContain('MUST NOT be used to authorize');
  });

  it('maps the legacy omnibus semantics to current separated authorities instead of inventing a replacement plane', () => {
    const historical = read(HISTORICAL_PATH);

    expect(historical).toContain('ADR-0095');
    expect(historical).toContain('ADR-0087');
    expect(historical).toContain('ESS-0011');
    expect(historical).toContain('ESS-0010');
    expect(historical).toContain('PVC-09..PVC-11');
    expect(historical).toContain('PVC-12..PVC-17');
    expect(historical).toContain('Compliance remains cross-cutting and owns no productive PVC stage');
  });

  it('keeps legacy UI references a foreign-owner compatibility concern rather than rewriting runtime in Governance scope', () => {
    const adminPortal = read('src/components/AdminPortal.tsx');
    const evidence = read(
      'docs/projects/governance/evidence/COMP_GAP_002_ADR0007_LIFECYCLE_SEMANTIC_RECONCILIATION_2026-09-05.md',
    );

    expect(adminPortal).toContain("adr: 'ADR-0007'");
    expect(evidence).toContain('src/components/AdminPortal.tsx');
    expect(evidence).toContain('not changed by this Governance work item');
  });
});
