import { describe, expect, it } from 'vitest';
import {
  collectDocumentationHygieneFindings,
  DOCUMENTATION_HYGIENE_VALIDATOR_VERSION,
} from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';

describe('Documentation Hygiene H0/H4/H5', () => {
  it('keeps the repository compliant with the canonical hygiene contract', () => {
    const findings = collectDocumentationHygieneFindings(process.cwd());
    expect(findings, DOCUMENTATION_HYGIENE_VALIDATOR_VERSION).toEqual([]);
  });
});
