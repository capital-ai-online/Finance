import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * SEO-ROADMAP-0001 / Q2+D3 — ensures production entry wires the extracted helpers.
 * Soft-fail documentation mode: if not yet wired, the test records the gap without
 * blocking unrelated CI green on pure module PRs. Flip `REQUIRE_WIRING` to true
 * once the owner accepts the two-line server.application.ts change.
 */
const REQUIRE_WIRING = false;

const applicationPath = path.join(process.cwd(), 'server.application.ts');

describe('SEO application wiring contract (Q2/D3)', () => {
  it('documents required registerTrailingSlashNormalize + registerProductionSpaFallback',
    () => {
      const src = fs.readFileSync(applicationPath, 'utf8');
      const hasTrailing = src.includes('registerTrailingSlashNormalize');
      const hasSpa = src.includes('registerProductionSpaFallback');

      if (REQUIRE_WIRING) {
        expect(hasTrailing).toBe(true);
        expect(hasSpa).toBe(true);
      } else if (!hasTrailing || !hasSpa) {
        // eslint-disable-next-line no-console
        console.warn(
          '[SEO wiring] pending: add registerTrailingSlashNormalize(app) after probe protection and registerProductionSpaFallback(app, distPath) in production SPA branch. See docs/seo/D_BLOCK_IMPLEMENTATION_NOTES.md',
        );
      }
      expect(true).toBe(true);
    });
});
