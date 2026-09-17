import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface RegistryEntry {
  documentId: string;
  type: string;
  owner: string;
  authority: string;
  version: string;
  language: 'de' | 'en' | 'mixed';
  lifecycle: 'draft' | 'generated' | 'reviewed' | 'approved' | 'superseded' | 'archived';
  path: string;
}

interface DocumentRegistry {
  schemaVersion: string;
  authority: string;
  entries: RegistryEntry[];
}

const repositoryRoot = process.cwd();
const registryPath = path.join(repositoryRoot, 'docs/governance/document-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as DocumentRegistry;

const ALLOWED_ROOT_MARKDOWN = new Set(['README.md', 'AGENTS.md', 'CLAUDE.md']);
const ALLOWED_LANGUAGES = new Set(['de', 'en', 'mixed']);
const ALLOWED_LIFECYCLES = new Set(['draft', 'generated', 'reviewed', 'approved', 'superseded', 'archived']);

describe('Documentation Hygiene H0/H4/H5', () => {
  it('allows only canonical Markdown documents in the repository root', () => {
    const rootMarkdown = fs.readdirSync(repositoryRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();

    const unexpected = rootMarkdown.filter((name) => !ALLOWED_ROOT_MARKDOWN.has(name));
    expect(unexpected).toEqual([]);
  });

  it('keeps document IDs and canonical paths unique', () => {
    const ids = registry.entries.map((entry) => entry.documentId);
    const paths = registry.entries.map((entry) => entry.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('requires every registry target to exist', () => {
    for (const entry of registry.entries) {
      expect(fs.existsSync(path.join(repositoryRoot, entry.path)), `${entry.documentId}: ${entry.path}`).toBe(true);
    }
  });

  it('requires stable registry metadata', () => {
    expect(registry.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(registry.authority).toBe('docs/governance/DOCUMENTATION_HYGIENE_POLICY.md');

    for (const entry of registry.entries) {
      expect(entry.documentId).toMatch(/^DOC-[A-Z0-9-]+$/);
      expect(entry.type.trim()).not.toBe('');
      expect(entry.owner.trim()).not.toBe('');
      expect(entry.authority.trim()).not.toBe('');
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(ALLOWED_LANGUAGES.has(entry.language)).toBe(true);
      expect(ALLOWED_LIFECYCLES.has(entry.lifecycle)).toBe(true);
    }
  });
});
