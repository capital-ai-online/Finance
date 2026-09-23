import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const readTypeScriptTree = (relativeDir: string): string => {
  const root = path.join(process.cwd(), relativeDir);
  const visit = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return visit(absolute);
      if (!/\.tsx?$/.test(entry.name)) return [];
      return [fs.readFileSync(absolute, 'utf8')];
    });
  return visit(root).join('\n');
};

const routes = read('src/app/routing/AppRoutes.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const landingPort = readTypeScriptTree('src/features/public/ui/frontend-port');
const realtimeNewsfeed = read('src/features/news/ui/RealtimeAiNewsfeed.tsx');
const authenticatedTransport = read('src/features/news/authenticatedNewsFetch.ts');
const entitlement = read('server/middleware/realtimeAiNewsfeedEntitlement.ts');

describe('LANDING-FIRST news integration gate', () => {
  it('keeps productive news outside the Owner-selected FRONTEND design port', () => {
    expect(landing).toContain('ReferenceApp');
    expect(landingPort).not.toMatch(/from\s+['"][^'"]*features\/news/);
    expect(routes).not.toContain('LandingRealtimeAiNewsfeed');
  });

  it('preserves one backend news boundary while allowing public read-only visibility', () => {
    expect(realtimeNewsfeed).toContain('VerifiedNewsFeed');
    expect(authenticatedTransport).toContain('authFetch(path, init)');
    expect(authenticatedTransport).not.toContain('supabase.auth.getSession');
    expect(entitlement).toContain("isFeaturePubliclyVisible('realtime_ai_newsfeed')");
    expect(entitlement).toContain("(req.method ?? 'GET').toUpperCase() === 'GET'");
    expect(entitlement).toContain('resolveVerifiedIdentity');
    expect(entitlement).toContain("canUseFeature('registered', tier, 'realtime_ai_newsfeed')");
  });
});
