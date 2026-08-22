import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultUiMessageCatalog } from '../index';
import { inspectWordingMigrationPlan, wordingMigrationPlan } from '../Migration/WordingMigrationPlan';

describe('VW-7 controlled wording migration', () => {
  it('keeps every migration candidate explicit and non-automatic', () => {
    expect(wordingMigrationPlan.length).toBeGreaterThan(0);
    expect(new Set(wordingMigrationPlan.map((item) => item.id)).size).toBe(wordingMigrationPlan.length);
    expect(wordingMigrationPlan.every((item) => item.automaticApplyAllowed === false)).toBe(true);
  });

  it('classifies hardcoded governed wording as OPEN rather than mutating it', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-vw7-'));
    const candidate = wordingMigrationPlan[0];
    const absolute = path.join(root, candidate.sourcePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, `<h2>${candidate.literal}</h2>`, 'utf8');

    const findings = inspectWordingMigrationPlan(root, createDefaultUiMessageCatalog(), [candidate]);
    expect(findings).toHaveLength(1);
    expect(findings[0].state).toBe('OPEN');
  });

  it('recognizes a stable message-key migration without requiring literal retention', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-vw7-'));
    const candidate = wordingMigrationPlan[0];
    const absolute = path.join(root, candidate.sourcePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, `getReactMessage('${candidate.messageKey}')`, 'utf8');

    const findings = inspectWordingMigrationPlan(root, createDefaultUiMessageCatalog(), [candidate]);
    expect(findings[0].state).toBe('MIGRATED');
  });
});
