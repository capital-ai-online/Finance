import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createDefaultUiMessageCatalog,
  fintechWordingBindings,
} from '../index';
import { scanWordingUsages } from '../node';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('VW-3 Wording Usage Index', () => {
  it('indexes only actual stable message-key references and exposes reverse impact', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-vocabulary-'));
    tempRoots.push(root);
    const target = path.join(root, 'src/features/screening/ui');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(
      path.join(target, 'Example.tsx'),
      "export const key = 'screening.request.title';\n",
      'utf8',
    );

    const catalog = createDefaultUiMessageCatalog();
    const index = scanWordingUsages(root, catalog, fintechWordingBindings, ['src/features']);
    const usages = index.byMessageKey('screening.request.title');

    expect(usages).toHaveLength(1);
    expect(usages[0].surface).toBe('react');
    expect(usages[0].feature).toBe('screening');

    const impact = index.impactForConcept('VOC-ANALYTICS-0001');
    expect(impact.messageKeys).toContain('screening.request.title');
    expect(impact.sourcePaths).toContain('src/features/screening/ui/Example.tsx');
  });
});
