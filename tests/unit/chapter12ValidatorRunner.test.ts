import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Chapter12ValidatorRunner } from '../../src/platform/Validators/Chapter12ValidatorRunner';
import type { RepositoryQualityObservation } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';

function observation(): RepositoryQualityObservation {
  const checkedAt = '2026-08-20T10:00:00.000Z';
  const checks = [
    ['platform-version', 'PASS'], ['documentation-hygiene', 'PASS'], ['documentation-consistency', 'PASS'],
    ['repository-conventions', 'PASS'], ['vocabulary', 'PASS'], ['compliance', 'PASS'],
  ].map(([domain, status]) => ({ domain, status, blocking: false, checkedAt, source: 'fixture', authorityRefs: ['fixture'], findings: [] })) as RepositoryQualityObservation['checks'];
  return {
    schemaVersion: 'repository-quality-observation/1.1.0', trustClass: 'read-only-governance-observation', repository: 'capital-ai-online/Finance',
    checkedAt, sourceCommit: 'a'.repeat(40), overallStatus: 'PASS', blocking: false, checks,
    summary: { checks: 6, passed: 6, warnings: 0, failed: 0, notAvailable: 0, findings: 0, errors: 0, warningFindings: 0, infoFindings: 0 },
    nonAuthorizingStatement: 'Repository quality evidence is read-only technical evidence. It does not authorize merge, release, deployment, production mutation, policy changes or privilege elevation.',
  };
}

describe('Chapter12ValidatorRunner', () => {
  it('executes all 16 mandatory validators without mutating the repository', () => {
    const before = fs.statSync('package.json').mtimeMs;
    const report = new Chapter12ValidatorRunner().run({ repoRoot: process.cwd(), checkedAt: '2026-08-20T10:00:00.000Z', sourceCommit: 'a'.repeat(40), repositoryObservation: observation() });
    expect(report.total).toBe(16);
    expect(report.executed).toBe(16);
    expect(report.results.map((item) => item.validatorName)).toHaveLength(16);
    expect(new Set(report.results.map((item) => item.validatorName)).size).toBe(16);
    expect(fs.statSync('package.json').mtimeMs).toBe(before);
  });

  it('reports missing knowledge and twin artifacts as real findings rather than missing validators', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-qv-'));
    for (const dir of ['.ai', 'docs', 'scripts', 'src/platform', 'supabase', 'tests', 'public']) fs.mkdirSync(path.join(root, dir), { recursive: true });
    const report = new Chapter12ValidatorRunner().run({ repoRoot: root, checkedAt: '2026-08-20T10:00:00.000Z', sourceCommit: null, repositoryObservation: observation() });
    expect(report.results.find((item) => item.validatorName === 'KnowledgeValidator')?.status).toBe('FAIL');
    expect(report.results.find((item) => item.validatorName === 'TwinValidator')?.status).toBe('FAIL');
    expect(report.notAvailable).toBe(0);
  });
});
