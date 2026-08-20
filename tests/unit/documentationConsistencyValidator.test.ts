import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateQmDocumentationConsistency } from '../../src/platform/Quality/Validators/DocumentationConsistencyValidator';

function write(root: string, relative: string, content: string): void {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function fixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qm-doc-'));
  write(root, 'src/platform/Quality/manifest.json', JSON.stringify({
    version: '1.1.0',
    contracts: [
      'repository-quality-observation/1.1.0',
      'quality-center-contract/1.3.0',
      'chapter12-validator-contract/1.0.0',
      'chapter12-validation-report/1.0.0',
      'fintech-value-chain-quality/1.0.0',
    ],
    tests: ['tests/unit/validatorRegistry.test.ts'],
  }));
  write(root, 'src/platform/Validators/manifest.json', JSON.stringify({ status: 'implemented', interfaces: ['ValidatorRegistry', 'Chapter12ValidatorRunner'] }));
  write(root, '.ai/registry/ess-registry.json', JSON.stringify({ entries: [{ id: 'ESS-0005', version: '1.1.0' }] }));
  write(root, '.ai/skills/ESS-0005-Quality-Center.md', '---\nskill:\n  id: ESS-0005\n  version: 1.1.0\ncapital_ai:\n  platform: CAPITAL-AI\n---\n');
  write(root, 'src/platform/Quality/README.md', '# Quality\n\nVersion: 1.1.0\n');
  write(root, 'package.json', JSON.stringify({ scripts: { 'repository:quality:check': 'tsx scripts/automation/validateRepositoryQuality.ts' } }));
  write(root, 'tests/unit/validatorRegistry.test.ts', '// test');
  return root;
}

describe('validateQmDocumentationConsistency', () => {
  it('passes a synchronized QM fixture', () => {
    const result = validateQmDocumentationConsistency(fixture(), '2026-08-20T00:00:00.000Z');
    expect(result).toMatchObject({ compliant: true, blocking: false });
    expect(result.findings).toEqual([]);
  });

  it('detects version drift and stale implementation claims', () => {
    const root = fixture();
    write(root, 'src/platform/Quality/README.md', '# Quality\n\nVersion: 1.0.0\n\nKeine funktionale Spezifikation und kein Code.\n');
    const result = validateQmDocumentationConsistency(root, '2026-08-20T00:00:00.000Z');
    expect(result.findings.map((finding) => finding.ruleId)).toContain('QM-DOC-010');
    expect(result.findings.map((finding) => finding.ruleId)).toContain('QM-DOC-016');
    expect(result.blocking).toBe(true);
  });
});
