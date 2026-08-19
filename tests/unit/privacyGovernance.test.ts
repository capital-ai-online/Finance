import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTROLLER,
  PRIVACY_COMPLIANCE_STATUS,
  PRIVACY_NOTICE_VERSION,
  PROCESSING_ACTIVITIES,
} from '../../src/privacy/privacyPolicy';

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('ADR-0094 privacy governance', () => {
  it('uses Sven Michael Kulessa as the canonical natural-person controller', () => {
    expect(CONTROLLER).toMatchObject({
      name: 'Sven Michael Kulessa',
      legalStatus: 'Privatperson',
      street: 'von Lepel Straße 3a',
      postalCode: '27259',
      city: 'Freistatt',
      country: 'Deutschland',
    });
  });

  it('keeps public legal UI free of obsolete controller identities and self-certification claims', () => {
    const publicLegalUi = [
      read('src/components/Datenschutz.tsx'),
      read('src/components/ImpressumAgb.tsx'),
      read('src/components/ComplianceConsentModal.tsx'),
    ].join('\n');

    for (const forbidden of [
      'Capital-AI GmbH',
      'AIFinancial GmbH',
      'DSGVO VERIFIZIERT',
      'Protokoll als Richter absegnen',
      'JURISDICTION APPROVAL',
      'Zertifiziert (Art. 32)',
      'Gerichtsfest',
    ]) {
      expect(publicLegalUi).not.toContain(forbidden);
    }

    expect(PRIVACY_COMPLIANCE_STATUS.disclaimer).toContain('keine behördliche, gerichtliche oder externe DSGVO-Zertifizierung'.replace('keine', 'Keine'));
  });

  it('uses DDG rather than the obsolete TMG imprint reference', () => {
    const imprint = read('src/components/ImpressumAgb.tsx');
    expect(imprint).toContain('§ 5 DDG');
    expect(imprint).not.toContain('§ 5 TMG');
  });

  it('keeps every processing activity transparent enough for the public registry', () => {
    expect(PROCESSING_ACTIVITIES.length).toBeGreaterThanOrEqual(8);
    for (const activity of PROCESSING_ACTIVITIES) {
      expect(activity.id).toBeTruthy();
      expect(activity.purpose).toBeTruthy();
      expect(activity.dataCategories.length).toBeGreaterThan(0);
      expect(activity.legalBasis).toContain('Art. 6');
      expect(activity.recipients.length).toBeGreaterThan(0);
      expect(activity.transfer).toBeTruthy();
      expect(activity.retention).toBeTruthy();
      expect(activity.technicalControls.length).toBeGreaterThan(0);
    }
  });

  it('keeps privacy-notice evidence version aligned with the database deployment guard', () => {
    expect(PRIVACY_NOTICE_VERSION).toBe('2026-08-19');
    const migration = read('supabase/migrations/20260819010000_privacy_governance_and_requests.sql');
    expect(migration).toContain("new.document_version := '2026-08-19'");
    expect(migration).toContain("new.evidence_kind := 'acknowledgement'");
    expect(migration).toContain("new.evidence_kind := 'contract_acceptance'");
    expect(migration).toContain("new.evidence_kind := 'consent'");
  });

  it('documents the VVT as an internal accountability artifact rather than a certification', () => {
    const vvt = read('docs/DATENSCHUTZ_PROTOKOLL.md');
    expect(vvt).toContain('keine behördliche, gerichtliche oder externe DSGVO-Zertifizierung');
    expect(vvt).toContain('Sven Michael Kulessa');
    expect(vvt).toContain('von Lepel Straße 3a');
    expect(vvt).toContain('27259 Freistatt');
  });
});
