import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DOCUMENTARY_AUTOSYNC_ENGINE_VERSION = 'documentary-autosync/1.0.0' as const;

export interface DocumentaryAutoSyncPatch {
  path: string;
  ruleIds: string[];
  previousSha256: string;
  proposedSha256: string;
  proposedContent: string;
}

export interface DocumentaryAutoSyncPlan {
  engineVersion: typeof DOCUMENTARY_AUTOSYNC_ENGINE_VERSION;
  sourceCommit: string;
  patches: DocumentaryAutoSyncPatch[];
}

interface Rule {
  id: string;
  path: string;
  apply(content: string): string;
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeNewline(value: string): string {
  return value.endsWith('\n') ? value : `${value}\n`;
}

const RULES: readonly Rule[] = Object.freeze([
  {
    id: 'DOC-AUTOSYNC-DATA-MASTER-INDEX-001',
    path: 'docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md',
    apply(content) {
      const lines = content.split(/\r?\n/)
        .filter((line) => !/^\|\s*`CAPITAL-AI-DATA`\s*\|/.test(line));
      return normalizeNewline(lines.join('\n').replace(
        /^\|\s*`CAPITAL-AI-FINTECH`\s*\|\s*`PVC-12\.\.PVC-17`\s*\|/m,
        '| `CAPITAL-AI-FINTECH` | `PVC-09..PVC-17` |',
      ));
    },
  },
  {
    id: 'DOC-AUTOSYNC-DATA-PROJECT-README-001',
    path: 'docs/projects/README.md',
    apply(content) {
      const lines = content.split(/\r?\n/)
        .filter((line) => !/^\|\s*`CAPITAL-AI-DATA`\s*\|/.test(line));
      return normalizeNewline(lines.join('\n').replace(
        /^\|\s*`CAPITAL-AI-FINTECH`\s*\|\s*`PVC-12`\.\.`PVC-17`\s*\|/m,
        '| `CAPITAL-AI-FINTECH` | `PVC-09`..`PVC-17` |',
      ));
    },
  },
  {
    id: 'DOC-AUTOSYNC-DATA-PVC-OWNER-001',
    path: 'docs/projects/PROJECT_VALUE_CHAIN.md',
    apply(content) {
      return normalizeNewline(content.replace(
        /^(\|\s*`PVC-(?:09|10|11)`\s*\|[^\n|]*\|\s*)`CAPITAL-AI-DATA`(\s*\|)$/gm,
        '$1`CAPITAL-AI-FINTECH`$2',
      ));
    },
  },
]);

export function registeredDocumentaryAutoSyncRules(): readonly Pick<Rule, 'id' | 'path'>[] {
  return RULES.map(({ id, path: rulePath }) => Object.freeze({ id, path: rulePath }));
}

export function planDocumentaryAutoSync(options: {
  repoRoot?: string;
  sourceCommit: string;
}): DocumentaryAutoSyncPlan {
  if (!/^[0-9a-f]{40}$/i.test(options.sourceCommit)) {
    throw new Error('[DocumentaryAutoSync] sourceCommit must be a full 40-character SHA.');
  }

  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const byPath = new Map<string, Rule[]>();
  for (const rule of RULES) {
    const list = byPath.get(rule.path) ?? [];
    list.push(rule);
    byPath.set(rule.path, list);
  }

  const patches: DocumentaryAutoSyncPatch[] = [];
  for (const [relativePath, rules] of byPath) {
    const absolute = path.resolve(repoRoot, relativePath);
    const root = path.resolve(repoRoot);
    if (!absolute.startsWith(`${root}${path.sep}`)) {
      throw new Error(`[DocumentaryAutoSync] rule path escapes repository: ${relativePath}`);
    }
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`[DocumentaryAutoSync] rule target must be a regular non-symlink file: ${relativePath}`);
    }

    const original = fs.readFileSync(absolute, 'utf8');
    let proposed = original;
    const applied: string[] = [];
    for (const rule of rules) {
      const next = rule.apply(proposed);
      if (next !== proposed) applied.push(rule.id);
      proposed = next;
    }

    if (proposed !== original) {
      patches.push({
        path: relativePath,
        ruleIds: applied,
        previousSha256: sha256(original),
        proposedSha256: sha256(proposed),
        proposedContent: proposed,
      });
    }
  }

  return Object.freeze({
    engineVersion: DOCUMENTARY_AUTOSYNC_ENGINE_VERSION,
    sourceCommit: options.sourceCommit.toLowerCase(),
    patches: patches.sort((a, b) => a.path.localeCompare(b.path)),
  });
}

export function applyDocumentaryAutoSyncPlan(plan: DocumentaryAutoSyncPlan, repoRoot = process.cwd()): string[] {
  const root = path.resolve(repoRoot);
  const changed: string[] = [];
  for (const patch of plan.patches) {
    const absolute = path.resolve(root, patch.path);
    if (!absolute.startsWith(`${root}${path.sep}`)) {
      throw new Error(`[DocumentaryAutoSync] patch path escapes repository: ${patch.path}`);
    }
    const current = fs.readFileSync(absolute, 'utf8');
    if (sha256(current) !== patch.previousSha256) {
      throw new Error(`[DocumentaryAutoSync] source drift before apply: ${patch.path}`);
    }
    if (sha256(patch.proposedContent) !== patch.proposedSha256) {
      throw new Error(`[DocumentaryAutoSync] proposed hash mismatch: ${patch.path}`);
    }
    fs.writeFileSync(absolute, patch.proposedContent, 'utf8');
    changed.push(patch.path);
  }
  return changed.sort();
}
