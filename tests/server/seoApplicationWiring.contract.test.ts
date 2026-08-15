import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * SEO-ROADMAP-0001 / Q2+D3 wiring contract.
 */
const routesPath = path.join(process.cwd(), 'server/routes/registerApplicationRoutes.ts');
const spaPath = path.join(process.cwd(), 'server/runtime/spaFallback.ts');

describe('SEO application wiring contract (Q2/D3)', () => {
  it('Q2: trailing-slash normalize is registered in route composition',
    () => {
      const routes = fs.readFileSync(routesPath, 'utf8');
      expect(routes).toContain('registerTrailingSlashNormalize');
      expect(routes).toContain('registerTrailingSlashNormalize(app)');
    });

  it('D3: soft-404 intercept is installed from route composition',
    () => {
      const routes = fs.readFileSync(routesPath, 'utf8');
      expect(routes).toContain('installProductionSoft404Intercept');
      const spa = fs.readFileSync(spaPath, 'utf8');
      expect(spa).toContain('installProductionSoft404Intercept');
      expect(spa).toContain('isPublicSpaPath');
    });
});
