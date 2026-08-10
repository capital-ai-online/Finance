import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverRepositoryCodeEvidence } from '../../src/platform/Documentary/Discovery/RepositoryCodeDiscovery';

describe('Documentary D1 repository code discovery', () => {
  it('discovers deterministic module, export, contract, route, event, manifest and dependency evidence', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-documentary-discovery-'));
    const componentDir = path.join(root, 'src/platform/Sample');
    fs.mkdirSync(componentDir, { recursive: true });
    fs.writeFileSync(path.join(componentDir, 'manifest.json'), JSON.stringify({ name: 'Sample', dependencies: ['src/platform/EventMesh'] }));
    fs.writeFileSync(path.join(componentDir, 'sample.ts'), [
      'export interface SampleContract { id: string }',
      'export const SampleEvent = "SampleEvent";',
      'export function sampleHandler() { return true; }',
      'router.get("/api/sample", sampleHandler);',
    ].join('\n'));

    const commit = '0d3ed9c5fde536435c1a21d6f4e0ca4c92385b7b';
    const first = discoverRepositoryCodeEvidence(root, commit);
    const second = discoverRepositoryCodeEvidence(root, commit);

    expect(first).toEqual(second);
    expect(first.evidence.some((item) => item.kind === 'manifest' && item.componentId === 'Sample')).toBe(true);
    expect(first.evidence.some((item) => item.kind === 'dependency' && item.symbol === 'src/platform/EventMesh')).toBe(true);
    expect(first.evidence.some((item) => item.kind === 'contract' && item.symbol === 'SampleContract')).toBe(true);
    expect(first.evidence.some((item) => item.kind === 'export' && item.symbol === 'sampleHandler')).toBe(true);
    expect(first.evidence.some((item) => item.kind === 'route' && item.symbol === '/api/sample')).toBe(true);
    expect(first.evidence.some((item) => item.kind === 'event' && item.symbol === 'SampleEvent')).toBe(true);
    expect(new Set(first.evidence.map((item) => item.evidenceId)).size).toBe(first.evidence.length);
  });

  it('fails closed without a valid source commit', () => {
    expect(() => discoverRepositoryCodeEvidence(process.cwd(), 'not-a-commit')).toThrow(/sourceCommit/);
  });
});
