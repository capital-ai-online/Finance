import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CoverageCollector } from '../../src/platform/Quality/Coverage/CoverageCollector';
import { QUALITY_TEST_AREAS } from '../../src/platform/Quality/Contracts/QualityCenterContract';

const created: string[] = [];

afterEach(() => {
  for (const directory of created.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('CoverageCollector', () => {
  it('counts executable tests and reads real coverage-summary evidence', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-quality-'));
    created.push(repoRoot);

    for (const area of QUALITY_TEST_AREAS) {
      const directory = path.join(repoRoot, 'tests', area);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, `${area}.test.ts`), 'export {};\n');
    }
    fs.mkdirSync(path.join(repoRoot, 'coverage'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'coverage', 'coverage-summary.json'), JSON.stringify({
      total: {
        statements: { pct: 91.2 },
        branches: { pct: 82.5 },
        functions: { pct: 88.1 },
        lines: { pct: 92.4 },
      },
    }));

    const result = new CoverageCollector().collect(repoRoot, '2026-08-20T00:00:00.000Z');

    expect(result.populatedAreas).toBe(7);
    expect(result.testAreaCoveragePercent).toBe(100);
    expect(result.testAreas.every((area) => area.testCount === 1)).toBe(true);
    expect(result.codeCoverage).toMatchObject({
      status: 'AVAILABLE',
      source: 'coverage/coverage-summary.json',
      metrics: { statements: 91.2, branches: 82.5, functions: 88.1, lines: 92.4 },
    });
  });

  it('does not invent code coverage when no artifact exists', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-quality-'));
    created.push(repoRoot);
    const result = new CoverageCollector().collect(repoRoot, '2026-08-20T00:00:00.000Z');
    expect(result.codeCoverage.status).toBe('NOT_AVAILABLE');
    expect(result.testAreaCoveragePercent).toBe(0);
  });
});
