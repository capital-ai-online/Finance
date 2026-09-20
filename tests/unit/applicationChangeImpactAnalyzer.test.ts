import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  analyzeApplicationChangeImpact,
  classifyApplicationChange,
} from '../../src/platform/Documentary/Discovery/ApplicationChangeImpactAnalyzer';

function write(root: string, relative: string, content: string): void {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function fixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-impact-'));
  write(root, 'docs/governance/document-registry.json', JSON.stringify({
    schemaVersion: '1.0.0',
    authority: 'docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md',
    entries: [
      {
        documentId: 'DOC-APP-ROUTES',
        type: 'reference',
        owner: 'CAPITAL-AI-DOC',
        authority: 'docs',
        version: '1.0.0',
        language: 'en',
        lifecycle: 'reviewed',
        path: 'docs/projects/documentary/APP_ROUTES.md',
      },
      {
        documentId: 'DOC-SEC-ROUTES',
        type: 'evidence',
        owner: 'CAPITAL-AI-SEC',
        authority: 'security',
        version: '1.0.0',
        language: 'en',
        lifecycle: 'reviewed',
        path: 'docs/security/ROUTE_EVIDENCE.md',
      },
      {
        documentId: 'DOC-APP-DEPS',
        type: 'reference',
        owner: 'CAPITAL-AI-DOC',
        authority: 'docs',
        version: '1.0.0',
        language: 'en',
        lifecycle: 'reviewed',
        path: 'docs/projects/documentary/DEPENDENCIES.md',
      },
      {
        documentId: 'DOC-OLD-DEPS',
        type: 'archive',
        owner: 'CAPITAL-AI-DOC',
        authority: 'docs',
        version: '1.0.0',
        language: 'en',
        lifecycle: 'archived',
        path: 'docs/archive/OLD_DEPENDENCIES.md',
      },
    ],
  }, null, 2));
  write(root, 'docs/projects/documentary/APP_ROUTES.md', '# Routes\n\nDepends on server/routes/registerApplicationRoutes.ts\n@depends on server/routes/registerApplicationRoutes.ts\n');
  write(root, 'docs/security/ROUTE_EVIDENCE.md', '# Security routes\n\nserver/routes/registerApplicationRoutes.ts\n');
  write(root, 'docs/projects/documentary/DEPENDENCIES.md', '# Dependencies\n\n@depends on package.json\n');
  write(root, 'docs/archive/OLD_DEPENDENCIES.md', '# Historical dependencies\n\n@depends on package.json\n');
  return root;
}

describe('ApplicationChangeImpactAnalyzer', () => {
  it('classifies route, dependency, runtime, contract, config and workflow changes', () => {
    expect(classifyApplicationChange('server/routes/registerApplicationRoutes.ts')).toBe('ROUTE');
    expect(classifyApplicationChange('package.json')).toBe('DEPENDENCY');
    expect(classifyApplicationChange('src/platform/Documentary/service.ts')).toBe('RUNTIME');
    expect(classifyApplicationChange('docs/contracts/API.schema.json')).toBe('CONTRACT');
    expect(classifyApplicationChange('config/runtime.yml')).toBe('CONFIG');
    expect(classifyApplicationChange('.github/workflows/ci.yml')).toBe('WORKFLOW');
  });

  it('maps dependency drift to current docs while excluding archived history', () => {
    const root = fixture();
    const report = analyzeApplicationChangeImpact({
      repoRoot: root,
      correlationId: 'DOC-DEPENDENCY-REGRESSION',
      sourceCommit: 'b'.repeat(40),
      sourceChanges: [{ path: 'package.json' }],
      generatedAt: '2026-09-20T00:00:00.000Z',
    });

    expect(report.dependencySignals).toEqual(['package.json']);
    expect(report.patchableDocumentationPaths).toContain('docs/projects/documentary/DEPENDENCIES.md');
    expect(report.patchableDocumentationPaths).not.toContain('docs/archive/OLD_DEPENDENCIES.md');
    expect(report.reviewOnlyDocumentationPaths).not.toContain('docs/archive/OLD_DEPENDENCIES.md');
  });

  it('maps changed application paths to patchable and review-only documentation', () => {
    const root = fixture();
    const report = analyzeApplicationChangeImpact({
      repoRoot: root,
      correlationId: 'DOC-IMPACT-TEST',
      sourceCommit: 'a'.repeat(40),
      sourceChanges: [{ path: 'server/routes/registerApplicationRoutes.ts' }],
      generatedAt: '2026-09-20T00:00:00.000Z',
    });

    expect(report.routeSignals).toEqual(['server/routes/registerApplicationRoutes.ts']);
    expect(report.patchableDocumentationPaths).toContain('docs/projects/documentary/APP_ROUTES.md');
    expect(report.reviewOnlyDocumentationPaths).toContain('docs/security/ROUTE_EVIDENCE.md');
  });
});
