import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const seoRoutes = read('server/middleware/seoUrlNormalize.ts');
const spaFallback = read('server/runtime/spaFallback.ts');

describe('Roadmap production direct-route fallback', () => {
  it('serves /roadmap through the non-indexable application SPA set', () => {
    const applicationStart = seoRoutes.indexOf('export const APPLICATION_SPA_PATHS');
    const applicationEnd = seoRoutes.indexOf(']);', applicationStart);
    const applicationBlock = seoRoutes.slice(applicationStart, applicationEnd);

    expect(applicationStart).toBeGreaterThanOrEqual(0);
    expect(applicationBlock).toContain("'/roadmap'");
    expect(spaFallback).toContain("case '/roadmap':");
    expect(spaFallback).toContain('return res.sendFile(files.root);');
  });

  it('does not promote /roadmap into the SEO public/prerender route contract', () => {
    const publicStart = seoRoutes.indexOf('export const PUBLIC_SPA_PATHS');
    const publicEnd = seoRoutes.indexOf(']);', publicStart);
    const publicBlock = seoRoutes.slice(publicStart, publicEnd);

    expect(publicStart).toBeGreaterThanOrEqual(0);
    expect(publicBlock).not.toContain("'/roadmap'");
  });
});
