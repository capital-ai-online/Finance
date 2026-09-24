import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const viteConfig = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');

describe('Vite native config loader warning hygiene', () => {
  it('uses import.meta.dirname instead of __dirname without suppressing the warning', () => {
    expect(viteConfig).not.toContain('__dirname');
    expect((viteConfig.match(/import\.meta\.dirname/g) ?? []).length).toBe(3);
    expect(viteConfig).not.toContain('VITE_CONFIG_NATIVE_IGNORE_WARNING');
  });
});
