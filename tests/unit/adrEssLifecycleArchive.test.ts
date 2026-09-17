import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const exists = (repoPath: string) => fs.existsSync(path.join(root, repoPath));
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');
const json = (repoPath: string) => JSON.parse(read(repoPath));

const ADR_ARCHIVE = 'docs/adr/historical/ADR-0066-passkey-only-owner-pr-authorization.md';
const ADR_REDIRECT = 'docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md';
const ESS_ARCHIVE = 'docs/archive/governance/historical/ESS-0022-Passkey-Only-Owner-PR-Authorization.md';
const ESS_ACTIVE = '.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md';
const RUNBOOK_ARCHIVE = 'docs/archive/governance/historical/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md';
const RUNBOOK_REDIRECT = 'docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md';
const ADR_AUTHORITY = 'AUTH-ADR-PASSKEY-OWNER-PR-AUTHORIZATION-0066';
const RUNBOOK_DOCUMENT_ID = 'DOC-RUNBOOK-M10-PASSKEY-OWNER-PR-AUTH';
const RETIRED_CHAIN_POLICY = 'docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md';

describe('ADR / ESS lifecycle archive invariants', () => {
  it('keeps retired M10 ADR-0066 historical and non-authorizing', () => {
    const adrRegistry = json('docs/adr/registry.json');
    const authorityRegistry = json('docs/governance/authority-registry.json');
    const adr = adrRegistry.migratedRecords.find((item: { displayId?: string }) => item.displayId === 'ADR-0066');
    const authority = authorityRegistry.entries.find((item: { authorityId?: string }) => item.authorityId === ADR_AUTHORITY);

    expect(adr).toMatchObject({
      authorityId: ADR_AUTHORITY,
      displayId: 'ADR-0066',
      lifecycle: 'historical',
      path: ADR_ARCHIVE,
    });
    expect(authority).toMatchObject({
      authorityId: ADR_AUTHORITY,
      displayId: 'ADR-0066',
      lifecycle: 'historical',
      path: ADR_ARCHIVE,
    });
    expect(exists(ADR_ARCHIVE)).toBe(true);
    expect(read(ADR_ARCHIVE)).toContain('HISTORICAL — NON-AUTHORIZING');
  });

  it('preserves ADR-0066 legacy links only through a non-authorizing redirect', () => {
    expect(exists(ADR_REDIRECT)).toBe(true);
    const redirect = read(ADR_REDIRECT);
    expect(redirect).toContain('Legacy ADR Redirect — NON-AUTHORIZING');
    expect(redirect).toContain(ADR_AUTHORITY);
    expect(redirect).toContain(ADR_ARCHIVE);
  });

  it('removes retired ESS-0022 from the active skill namespace', () => {
    const essRegistry = json('.ai/registry/ess-registry.json');
    const ess = essRegistry.entries.find((item: { id?: string }) => item.id === 'ESS-0022');

    expect(ess).toMatchObject({
      id: 'ESS-0022',
      status: 'historical',
      document: ESS_ARCHIVE,
      scope: 'historical-non-authorizing',
    });
    expect(exists(ESS_ACTIVE)).toBe(false);
    expect(exists(ESS_ARCHIVE)).toBe(true);
    expect(read(ESS_ARCHIVE)).toContain('HISTORICAL — RETIRED — NON-AUTHORIZING');
  });

  it('archives the retired M10 operational runbook and leaves only a non-authorizing compatibility path', () => {
    const documentRegistry = json('docs/governance/document-registry.json');
    const runbook = documentRegistry.entries.find((item: { documentId?: string }) => item.documentId === RUNBOOK_DOCUMENT_ID);

    expect(runbook).toMatchObject({
      documentId: RUNBOOK_DOCUMENT_ID,
      lifecycle: 'historical',
      path: RUNBOOK_ARCHIVE,
    });
    expect(exists(RUNBOOK_ARCHIVE)).toBe(true);
    expect(read(RUNBOOK_ARCHIVE)).toContain('M10 — Passkey-only Human/Owner PR Authorization Runbook');
    expect(exists(RUNBOOK_REDIRECT)).toBe(true);
    const redirect = read(RUNBOOK_REDIRECT);
    expect(redirect).toContain('Legacy M10 Runbook Redirect — NON-AUTHORIZING');
    expect(redirect).toContain(RUNBOOK_ARCHIVE);
  });

  it('keeps M10 retirement in the single AGENTS trust root without restoring DevelopmentChain policy', () => {
    const agents = read('AGENTS.md');
    const controlCatalog = json('docs/governance/control-catalog.json');
    const m10 = controlCatalog.controls.find((item: { controlId?: string }) => item.controlId === 'CTRL-CI-M10-001');

    expect(exists(RETIRED_CHAIN_POLICY)).toBe(false);
    expect(agents).toContain('M10 AUTHORIZE_PR_CI');
    expect(agents).toContain('RETIRED / OFF');
    expect(agents).toContain('MUST NOT search');
    expect(m10).toMatchObject({
      controlId: 'CTRL-CI-M10-001',
      status: 'required',
    });
    expect(m10.requirement).toContain('PR #691');
    expect(m10.requirement).toMatch(/MUST NOT search/i);
  });
});
