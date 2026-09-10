import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { computeRuntimeArtifactIdentity } from '../../scripts/automation/runtimeArtifactIdentity';

const tempRoots: string[] = [];

function tempRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-runtime-artifact-'));
  tempRoots.push(root);
  return root;
}

function write(root: string, relativePath: string, content: string): void {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

afterEach(() => {
  while (tempRoots.length > 0) {
    fs.rmSync(tempRoots.pop()!, { recursive: true, force: true });
  }
});

describe('computeRuntimeArtifactIdentity', () => {
  it('is deterministic across filesystem creation order', () => {
    const left = tempRoot();
    write(left, 'dist/server.cjs', 'server');
    write(left, 'dist/assets/app.js', 'app');

    const right = tempRoot();
    write(right, 'dist/assets/app.js', 'app');
    write(right, 'dist/server.cjs', 'server');

    expect(computeRuntimeArtifactIdentity(left)).toEqual(computeRuntimeArtifactIdentity(right));
  });

  it('excludes post-build control-plane, security and quality evidence from runtime identity', () => {
    const root = tempRoot();
    write(root, 'dist/server.cjs', 'server');
    write(root, 'dist/assets/app.js', 'app');
    const before = computeRuntimeArtifactIdentity(root);

    write(root, 'dist/control-plane/release-manifest.json', '{"changed":true}');
    write(root, 'dist/security/sbom.cdx.json', '{"changed":true}');
    write(root, 'dist/security/provenance.json', '{"changed":true}');
    // runQualityExecution.ts intentionally materializes this snapshot after the
    // release manifest. It must not mutate the already finalized runtime digest.
    write(root, 'dist/quality/quality-center-report.json', '{"sourceCommit":"abc123"}');
    const after = computeRuntimeArtifactIdentity(root);

    expect(after).toEqual(before);
    expect(after.subjects.map(subject => subject.name)).toEqual([
      'dist/assets/app.js',
      'dist/server.cjs',
    ]);
  });

  it('changes the aggregate and file subject digest when runtime content changes', () => {
    const root = tempRoot();
    write(root, 'dist/server.cjs', 'server-v1');
    const before = computeRuntimeArtifactIdentity(root);

    write(root, 'dist/server.cjs', 'server-v2');
    const after = computeRuntimeArtifactIdentity(root);

    expect(after.sha256).not.toBe(before.sha256);
    expect(after.subjects[0].digest.sha256).not.toBe(before.subjects[0].digest.sha256);
  });

  it('fails closed when the runtime build tree is missing or empty', () => {
    const missing = tempRoot();
    expect(() => computeRuntimeArtifactIdentity(missing)).toThrow(/Runtime-Build-Verzeichnis fehlt/);

    const empty = tempRoot();
    fs.mkdirSync(path.join(empty, 'dist', 'security'), { recursive: true });
    write(empty, 'dist/security/sbom.cdx.json', '{}');
    expect(() => computeRuntimeArtifactIdentity(empty)).toThrow(/Keine Runtime-Build-Artefakte/);
  });
});
