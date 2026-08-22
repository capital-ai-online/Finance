import fs from 'node:fs';
import path from 'node:path';
import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import type { UiMessageSurface } from '../Messages/UiMessage';
import type { FintechValueChainWordingBinding } from '../ValueChain/FintechWordingBinding';
import type { WordingImpactReport, WordingUsageReference } from './WordingUsage';

const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const DEFAULT_ROOTS = ['src/app', 'src/features', 'src/shared', 'src/components', 'server', 'scripts/seo'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

function stableUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

export class WordingUsageIndex {
  private readonly usages: WordingUsageReference[] = [];

  constructor(private readonly messages: UiMessageCatalog) {}

  register(usage: WordingUsageReference): void {
    const message = this.messages.get(usage.messageKey);
    if (!message) throw new Error(`Unknown UI message key in wording usage: ${usage.messageKey}`);

    const unknownConcepts = usage.conceptIds.filter((conceptId) => !message.conceptIds.includes(conceptId));
    if (unknownConcepts.length > 0) {
      throw new Error(`Usage ${usage.messageKey} references concepts outside its message contract: ${unknownConcepts.join(', ')}`);
    }

    this.usages.push(Object.freeze({
      ...usage,
      conceptIds: Object.freeze([...usage.conceptIds]) as unknown as string[],
      fintechStageIds: Object.freeze([...(usage.fintechStageIds ?? [])]) as unknown as WordingUsageReference['fintechStageIds'],
    }));
  }

  registerAll(usages: readonly WordingUsageReference[]): void {
    for (const usage of usages) this.register(usage);
  }

  list(): WordingUsageReference[] {
    return [...this.usages].sort((a, b) => `${a.messageKey}|${a.sourcePath}`.localeCompare(`${b.messageKey}|${b.sourcePath}`));
  }

  byMessageKey(messageKey: string): WordingUsageReference[] {
    return this.list().filter((usage) => usage.messageKey === messageKey);
  }

  impactForConcept(conceptId: string): WordingImpactReport {
    const matching = this.list().filter((usage) => usage.conceptIds.includes(conceptId));
    return {
      conceptId,
      messageKeys: stableUnique(matching.map((usage) => usage.messageKey)),
      sourcePaths: stableUnique(matching.map((usage) => usage.sourcePath)),
      features: stableUnique(matching.map((usage) => usage.feature).filter((value): value is string => Boolean(value))),
      routes: stableUnique(matching.map((usage) => usage.route).filter((value): value is string => Boolean(value))),
      surfaces: stableUnique(matching.map((usage) => usage.surface)),
      fintechStageIds: stableUnique(matching.flatMap((usage) => usage.fintechStageIds ?? [])),
    };
  }
}

export function scanWordingUsages(
  repoRoot: string,
  messages: UiMessageCatalog,
  bindings: readonly FintechValueChainWordingBinding[],
  roots: readonly string[] = DEFAULT_ROOTS,
): WordingUsageIndex {
  const index = new WordingUsageIndex(messages);
  const bindingByMessage = new Map<string, FintechValueChainWordingBinding[]>();
  for (const binding of bindings) {
    for (const messageKey of binding.messageKeys) {
      const current = bindingByMessage.get(messageKey) ?? [];
      current.push(binding);
      bindingByMessage.set(messageKey, current);
    }
  }

  for (const relativeRoot of roots) {
    const absoluteRoot = path.join(repoRoot, relativeRoot);
    for (const absolutePath of walk(absoluteRoot)) {
      const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/g, '/');
      const content = fs.readFileSync(absolutePath, 'utf8');

      for (const message of messages.list()) {
        if (!containsQuotedKey(content, message.key)) continue;
        const stageIds = (bindingByMessage.get(message.key) ?? []).map((binding) => binding.stageId);
        index.register({
          messageKey: message.key,
          conceptIds: [...message.conceptIds],
          surface: inferSurface(relativePath, message.context),
          sourcePath: relativePath,
          feature: inferFeature(relativePath),
          fintechStageIds: stableUnique(stageIds),
        });
      }
    }
  }

  return index;
}

function walk(root: string, result: string[] = []): string[] {
  if (!fs.existsSync(root)) return result;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) walk(absolute, result);
    else if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) result.push(absolute);
  }
  return result;
}

function containsQuotedKey(content: string, key: string): boolean {
  return content.includes(`'${key}'`) || content.includes(`"${key}"`) || content.includes(`\`${key}\``);
}

function inferSurface(relativePath: string, declared: UiMessageSurface): UiMessageSurface {
  if (declared !== 'shared') return declared;
  if (/seo/i.test(relativePath)) return 'seo';
  if (/mail|email/i.test(relativePath)) return 'email';
  if (/pdf|report/i.test(relativePath)) return 'pdf';
  if (/\.tsx$/.test(relativePath)) return 'react';
  return 'shared';
}

function inferFeature(relativePath: string): string | undefined {
  const match = relativePath.match(/^src\/features\/([^/]+)\//);
  return match?.[1];
}
