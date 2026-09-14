import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectGovDoc007Findings } from '../../src/platform/Documentary/Governance/Validators/GovDoc007Validator';

function fixture(run: (repoRoot: string) => void): void {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-007-'));
  try {
    fs.mkdirSync(path.join(repoRoot, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'docs', 'source.md'), '# Source\n');
    fs.writeFileSync(path.join(repoRoot, 'docs', 'target.md'), '# Target\n');
    run(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

describe('GOV-DOC-007', () => {
  it('reports missing local references and accepts existing targets', () => {
    fixture((repoRoot) => {
      const findings = collectGovDoc007Findings({
        repoRoot,
        references: [
          { documentId: 'DOC-SOURCE', documentPath: 'docs/source.md', line: 1, referencedPath: './target.md' },
          { documentId: 'DOC-SOURCE', documentPath: 'docs/source.md', line: 2, referencedPath: './missing.md#section' },
        ],
      });

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ ruleId: 'GOV-DOC-007', severity: 'Low', documentId: 'DOC-SOURCE' });
      expect(findings[0].evidence[0]).toEqual({
        type: 'FileReference',
        path: 'docs/source.md',
        line: 2,
        referencedPath: 'docs/missing.md',
      });
    });
  });

  it('reports repository escapes and keeps deterministic ordering', () => {
    fixture((repoRoot) => {
      const findings = collectGovDoc007Findings({
        repoRoot,
        references: [
          { documentId: 'DOC-SOURCE', documentPath: 'docs/source.md', line: 9, referencedPath: './z.md' },
          { documentId: 'DOC-SOURCE', documentPath: 'docs/source.md', line: 2, referencedPath: './a.md' },
          { documentId: 'DOC-SOURCE', documentPath: 'docs/source.md', line: 3, referencedPath: '../../../outside.md' },
        ],
      });

      expect(findings.map((finding) => finding.evidence[0].referencedPath)).toEqual([
        'docs/a.md',
        '../../../outside.md',
        'docs/z.md',
      ]);
    });
  });
});
