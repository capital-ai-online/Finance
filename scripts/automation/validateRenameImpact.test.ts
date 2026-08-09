import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyzeRenameImpact } from './validateRenameImpact';

const roots: string[] = [];

function makeRepo(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-rename-'));
  roots.push(root);
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
  }
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('validateRenameImpact', () => {
  it('classifies documentation-only migration to an approved canonical term as SAFE', () => {
    const root = makeRepo({ 'docs/de/billing.md': 'Abo Beschreibung' });
    const report = analyzeRenameImpact({ rootDir: root, sourceTerm: 'Abo', targetTerm: 'Subscription' });

    expect(report.classification).toBe('SAFE');
    expect(report.documentationReferences).toBe(1);
    expect(report.runtimeReferences).toBe(0);
  });

  it('classifies ordinary runtime references as CONDITIONAL', () => {
    const root = makeRepo({ 'src/example.ts': 'export const Abo = true;' });
    const report = analyzeRenameImpact({ rootDir: root, sourceTerm: 'Abo', targetTerm: 'Subscription' });

    expect(report.classification).toBe('CONDITIONAL');
    expect(report.findings.some((finding) => finding.code === 'RUNTIME_REFERENCE')).toBe(true);
  });

  it('blocks a forbidden Vocabulary target', () => {
    const root = makeRepo({ 'docs/example.md': 'Abo' });
    const report = analyzeRenameImpact({ rootDir: root, sourceTerm: 'Abo', targetTerm: 'Membership' });

    expect(report.classification).toBe('BLOCKED');
    expect(report.findings.some((finding) => finding.code === 'TARGET_FORBIDDEN_TERM')).toBe(true);
  });

  it('blocks targets that are not approved canonicalCodeTerms', () => {
    const root = makeRepo({ 'docs/example.md': 'Abo' });
    const report = analyzeRenameImpact({ rootDir: root, sourceTerm: 'Abo', targetTerm: 'Plan' });

    expect(report.classification).toBe('BLOCKED');
    expect(report.findings.some((finding) => finding.code === 'TARGET_NOT_APPROVED_CANONICAL_TERM')).toBe(true);
  });

  it('blocks sensitive environment/config references', () => {
    const root = makeRepo({ 'src/config.ts': 'const value = process.env.Abo;' });
    const report = analyzeRenameImpact({ rootDir: root, sourceTerm: 'Abo', targetTerm: 'Subscription' });

    expect(report.classification).toBe('BLOCKED');
    expect(report.findings.some((finding) => finding.code === 'ENV_OR_CONFIG_REFERENCE')).toBe(true);
  });

  it('blocks case-only renames', () => {
    const root = makeRepo({ 'docs/example.md': 'Backtest' });
    const report = analyzeRenameImpact({ rootDir: root, sourceTerm: 'Backtest', targetTerm: 'backtest' });

    expect(report.classification).toBe('BLOCKED');
    expect(report.findings.some((finding) => finding.code === 'CASE_ONLY_RENAME')).toBe(true);
  });
});
