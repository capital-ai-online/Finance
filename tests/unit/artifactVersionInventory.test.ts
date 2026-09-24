import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildArtifactVersionInventory,
  type ArtifactVersionInventoryEntry,
} from '../../src/platform/Release/Services/artifactVersionInventory';

const tempRoots: string[] = [];

function write(root: string, relativePath: string, content: string | Buffer): void {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function git(root: string, args: string[]): void {
  execFileSync('git', args, { cwd: root, stdio: 'ignore' });
}

function createFixture(extra: Record<string, string | Buffer> = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-artifact-version-inventory-'));
  tempRoots.push(root);
  git(root, ['init', '-q']);

  const files: Record<string, string | Buffer> = {
    'package.json': JSON.stringify({ name: 'capital-ai', version: '0.6.4' }, null, 2),
    'package-lock.json': JSON.stringify({
      name: 'capital-ai',
      version: '0.6.4',
      lockfileVersion: 3,
      packages: { '': { name: 'capital-ai', version: '0.6.4' } },
    }, null, 2),
    'src/contracts/rule.ts': "export const RULE_CONTRACT_VERSION = 'rule-contract/1.2.3' as const;\n",
    'schemas/finding.schema.json': JSON.stringify({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://capital-ai.online/schema/finding/2.0.0',
      schemaVersion: '2.0.0',
      type: 'object',
    }, null, 2),
    'src/app.ts': "export const value = 'ordinary source';\n",
    'docs/generated/snapshot.json': JSON.stringify({ version: '99.0.0', value: true }, null, 2),
    ...extra,
  };

  for (const [relativePath, content] of Object.entries(files)) write(root, relativePath, content);
  git(root, ['add', '-A']);
  return root;
}

function byPath(entries: ArtifactVersionInventoryEntry[], repoPath: string): ArtifactVersionInventoryEntry {
  const entry = entries.find((candidate) => candidate.path === repoPath);
  if (!entry) throw new Error('Missing inventory entry ' + repoPath);
  return entry;
}

function snapshotTrackedBytes(root: string): Map<string, Buffer> {
  const raw = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
  const result = new Map<string, Buffer>();
  for (const repoPath of raw.split('\0').filter(Boolean)) {
    result.set(repoPath, fs.readFileSync(path.join(root, repoPath)));
  }
  return result;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('artifact version inventory VAI-01', () => {
  it('classifies every tracked path into exactly one approved domain', () => {
    const root = createFixture({
      'docs/governance/manifest.json': JSON.stringify({
        schemaVersion: '1.0.0',
        version: '2.0.0',
      }, null, 2),
    });
    const inventory = buildArtifactVersionInventory(root);

    expect(inventory.entries).toHaveLength(7);
    expect(Object.values(inventory.counts).reduce((sum, count) => sum + count, 0)).toBe(inventory.entries.length);
    expect(byPath(inventory.entries, 'package.json').domain).toBe('PLATFORM_VERSION_AUTHORITY');
    expect(byPath(inventory.entries, 'package-lock.json').domain).toBe('PLATFORM_VERSION_MIRROR');
    expect(byPath(inventory.entries, 'src/contracts/rule.ts').domain).toBe('SEMANTIC_CONTRACT_VERSIONED');
    expect(byPath(inventory.entries, 'schemas/finding.schema.json').domain).toBe('SCHEMA_VERSIONED');
    expect(byPath(inventory.entries, 'src/app.ts').domain).toBe('DERIVED_CONTENT_IDENTITY');
    expect(byPath(inventory.entries, 'docs/generated/snapshot.json').domain).toBe('GENERATED_OR_EPHEMERAL');
    expect(byPath(inventory.entries, 'docs/governance/manifest.json').domain).toBe('UNCLASSIFIED_REQUIRES_OWNER_REVIEW');
    expect(inventory.unclassifiedPaths).toEqual(['docs/governance/manifest.json']);
  });

  it('binds declarations to the indexed blob instead of unstaged working-tree drift', () => {
    const root = createFixture();
    const first = buildArtifactVersionInventory(root);
    const firstContract = byPath(first.entries, 'src/contracts/rule.ts');

    write(root, 'src/contracts/rule.ts', JSON.stringify({ schemaVersion: '99.0.0' }, null, 2));
    const unstaged = buildArtifactVersionInventory(root);
    const unstagedContract = byPath(unstaged.entries, 'src/contracts/rule.ts');

    expect(unstaged.contentInventoryHash).toBe(first.contentInventoryHash);
    expect(unstagedContract.blobSha).toBe(firstContract.blobSha);
    expect(unstagedContract.domain).toBe(firstContract.domain);
    expect(unstagedContract.semanticVersion).toBe(firstContract.semanticVersion);
  });

  it('produces a deterministic hash for an unchanged Git index and changes when one tracked blob changes', () => {
    const root = createFixture();
    const first = buildArtifactVersionInventory(root);
    const second = buildArtifactVersionInventory(root);
    expect(second.contentInventoryHash).toBe(first.contentInventoryHash);

    write(root, 'src/app.ts', "export const value = 'changed source';\n");
    git(root, ['add', 'src/app.ts']);
    const changed = buildArtifactVersionInventory(root);
    expect(changed.contentInventoryHash).not.toBe(first.contentInventoryHash);
    expect(byPath(changed.entries, 'src/app.ts').blobSha).not.toBe(byPath(first.entries, 'src/app.ts').blobSha);
  });

  it('keeps package.json as the only platform-version authority and does not promote arbitrary version fields', () => {
    const root = createFixture({
      'config/package.json': JSON.stringify({ version: '9.9.9' }, null, 2),
      'metadata.json': JSON.stringify({ version: '0.6.4' }, null, 2),
    });
    const inventory = buildArtifactVersionInventory(root);
    const authorities = inventory.entries.filter((entry) => entry.domain === 'PLATFORM_VERSION_AUTHORITY');

    expect(authorities.map((entry) => entry.path)).toEqual(['package.json']);
    expect(inventory.platformVersionAuthority).toEqual({ path: 'package.json', version: '0.6.4' });
    expect(byPath(inventory.entries, 'config/package.json').domain).toBe('DERIVED_CONTENT_IDENTITY');
    expect(byPath(inventory.entries, 'metadata.json').domain).toBe('DERIVED_CONTENT_IDENTITY');
  });

  it('records escaped workflow contract-version literals without turning the consumer into an authority', () => {
    const root = createFixture({
      '.github/workflows/pr-consumer.yml':
        "name: PR consumer\nsteps:\n  - run: node -e \\"const currentV18 = /CAPITAL_AI_PR_TEMPLATE_VERSION:\\\\s*1\\\\.8\\\\.0/.test(body)\\"\n",
    });
    const inventory = buildArtifactVersionInventory(root);
    const consumer = byPath(inventory.entries, '.github/workflows/pr-consumer.yml');

    expect(consumer.domain).toBe('DERIVED_CONTENT_IDENTITY');
    expect(consumer.signals).toContainEqual({
      kind: 'WORKFLOW_CONTRACT_VERSION_LITERAL',
      name: 'CAPITAL_AI_PR_TEMPLATE_VERSION',
      value: '1.8.0',
    });
  });

  it('does not treat incidental generated wording inside ordinary source as generated identity', () => {
    const root = createFixture({
      'src/scanner.ts': "export const marker = /generated file|do not edit/;\n",
    });
    const inventory = buildArtifactVersionInventory(root);
    expect(byPath(inventory.entries, 'src/scanner.ts').domain).toBe('DERIVED_CONTENT_IDENTITY');
  });

  it('is read-only and never performs a blanket SemVer rewrite', () => {
    const root = createFixture({
      'docs/ordinary.md': 'Historical platform text mentions Version 0.1.0 without declaring authority.\n',
    });
    const before = snapshotTrackedBytes(root);
    buildArtifactVersionInventory(root);
    const after = snapshotTrackedBytes(root);

    expect([...after.keys()]).toEqual([...before.keys()]);
    for (const [repoPath, bytes] of before) {
      expect(after.get(repoPath)).toEqual(bytes);
    }
  });

  it('detects same-version PR-template structural drift through blob and inventory identity', () => {
    const root = createFixture({
      '.github/pull_request_template.md':
        '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->\n' +
        'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0\n' +
        '<details>\n<summary>Technical Evidence</summary>\nold body\n</details>\n',
    });

    const first = buildArtifactVersionInventory(root);
    const firstTemplate = byPath(first.entries, '.github/pull_request_template.md');
    expect(firstTemplate.domain).toBe('SEMANTIC_CONTRACT_VERSIONED');
    expect(firstTemplate.semanticVersion).toBe('1.8.0');

    write(
      root,
      '.github/pull_request_template.md',
      '<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0 -->\n' +
        'CAPITAL_AI_PR_TEMPLATE_VERSION: 1.8.0\n' +
        '<details>\n<summary>Technical Evidence and Traceability</summary>\nnew canonical body\n</details>\n',
    );
    git(root, ['add', '.github/pull_request_template.md']);

    const second = buildArtifactVersionInventory(root);
    const secondTemplate = byPath(second.entries, '.github/pull_request_template.md');
    expect(secondTemplate.semanticVersion).toBe(firstTemplate.semanticVersion);
    expect(secondTemplate.blobSha).not.toBe(firstTemplate.blobSha);
    expect(second.contentInventoryHash).not.toBe(first.contentInventoryHash);
  });
});
