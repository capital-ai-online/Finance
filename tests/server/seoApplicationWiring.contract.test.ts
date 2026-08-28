import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * SEO-GM-ROADMAP-0002 / Q2+D3 wiring contract.
 */
const routesPath = path.join(process.cwd(), 'server/routes/registerApplicationRoutes.ts');
const spaPath = path.join(process.cwd(), 'server/runtime/spaFallback.ts');
const appPath = path.join(process.cwd(), 'server.application.ts');

describe('SEO application wiring contract (Q2/D3)', () => {
  it('Q2: trailing-slash normalize is registered in route composition',
    () => {
      const routes = fs.readFileSync(routesPath, 'utf8');
      expect(routes).toContain('registerTrailingSlashNormalize');
      expect(routes).toContain('registerTrailingSlashNormalize(app)');
    });

  it('D3: soft-404 helpers exist and production composition root uses allow-list fallback',
    () => {
      const routes = fs.readFileSync(routesPath, 'utf8');
      expect(routes).toContain('installProductionSoft404Intercept');
      const spa = fs.readFileSync(spaPath, 'utf8');
      expect(spa).toContain('installProductionSoft404Intercept');
      expect(spa).toContain('registerProductionSpaFallback');
      expect(spa).toContain('isApplicationSpaPath');

      const app = fs.readFileSync(appPath, 'utf8');
      expect(app).toContain('registerProductionSpaFallback');
      expect(app).toContain('registerProductionSpaFallback(app, distPath)');
      expect(app).toContain('express.static(distPath, { redirect: false, index: false })');
      // Naive catch-all must not remain the production source of truth.
      expect(app).not.toMatch(/app\.get\('\*'\s*,\s*\(req,\s*res\)\s*=>\s*\{\s*res\.sendFile\(path\.join\(distPath,\s*'index\.html'\)\)/);
    });
});
