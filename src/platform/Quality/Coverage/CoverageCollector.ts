import fs from 'node:fs';
import path from 'node:path';
import {
  QUALITY_TEST_AREAS,
  type QualityCodeCoverageMetrics,
  type QualityCoverageSnapshot,
  type QualityTestAreaCoverage,
} from '../Contracts/QualityCenterContract';

export const COVERAGE_COLLECTOR_VERSION = 'coverage-collector/1.0.0' as const;

const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/i;
const COVERAGE_SUMMARY_CANDIDATES = [
  'coverage/coverage-summary.json',
  '.quality/coverage-summary.json',
] as const;

function normalizePath(value: string): string {
  return value.split(path.sep).join('/');
}

function collectTestFiles(directory: string, repoRoot: string): string[] {
  const out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTestFiles(fullPath, repoRoot));
      continue;
    }
    if (TEST_FILE_PATTERN.test(entry.name)) {
      out.push(normalizePath(path.relative(repoRoot, fullPath)));
    }
  }

  return out.sort();
}

function readPct(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null;
  const pct = (value as { pct?: unknown }).pct;
  return typeof pct === 'number' && Number.isFinite(pct) && pct >= 0 && pct <= 100 ? pct : null;
}

function readCodeCoverage(repoRoot: string): QualityCoverageSnapshot['codeCoverage'] {
  for (const relativePath of COVERAGE_SUMMARY_CANDIDATES) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) continue;

    try {
      const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as {
        total?: Record<string, unknown>;
      };
      const total = parsed.total ?? {};
      const metrics: QualityCodeCoverageMetrics = {
        statements: readPct(total.statements),
        branches: readPct(total.branches),
        functions: readPct(total.functions),
        lines: readPct(total.lines),
      };
      const available = Object.values(metrics).some((value) => value !== null);
      if (!available) continue;

      return Object.freeze({
        status: 'AVAILABLE' as const,
        source: relativePath,
        metrics: Object.freeze(metrics),
      });
    } catch {
      // Invalid/stale coverage files must not be interpreted as successful evidence.
    }
  }

  return Object.freeze({
    status: 'NOT_AVAILABLE' as const,
    source: null,
    metrics: null,
  });
}

export class CoverageCollector {
  collect(repoRoot = process.cwd(), checkedAt = new Date().toISOString()): QualityCoverageSnapshot {
    if (Number.isNaN(Date.parse(checkedAt))) {
      throw new Error('[CoverageCollector] checkedAt must be an ISO-compatible timestamp.');
    }

    const testAreas: QualityTestAreaCoverage[] = QUALITY_TEST_AREAS.map((area) => {
      const relativePath = `tests/${area}`;
      const testFiles = collectTestFiles(path.join(repoRoot, relativePath), repoRoot);
      return Object.freeze({
        area,
        path: relativePath,
        testFiles: Object.freeze(testFiles),
        testCount: testFiles.length,
      });
    });

    const populatedAreas = testAreas.filter((area) => area.testCount > 0).length;
    const totalAreas = QUALITY_TEST_AREAS.length;
    const testAreaCoveragePercent = Math.round((populatedAreas / totalAreas) * 10_000) / 100;

    return Object.freeze({
      schemaVersion: 'quality-coverage/1.0.0' as const,
      checkedAt,
      populatedAreas,
      totalAreas,
      testAreaCoveragePercent,
      testAreas: Object.freeze(testAreas),
      codeCoverage: readCodeCoverage(repoRoot),
      authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12', 'ESS-0005', 'ESS-0011']),
    });
  }
}
